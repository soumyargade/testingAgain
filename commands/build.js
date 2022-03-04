const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const cp = require("child_process");
const ssh = require('../lib/exec/ssh');
const yaml = require('js-yaml');
const mustache = require('mustache');

exports.command = 'build [job_name] [build_file]';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};

class Step {
    constructor(name, command) {
        this.name = name;
        this.command = command.replace(/"/g, '\\"'); //escape '"'
    }

    async execute(context) {
        try {
            await ssh(mustache.render(this.command, Env), context, true, this.command);
        } catch (e) {
            throw `Unable to complete step "${this.name}". ${e}`;
        }
    }
}

class Setup {
    constructor(name, steps) {
        this.name = name;
        this.steps = steps;
    }

    async runSteps(context) {
        console.log(`Running setup "${this.name}" (${this.steps.length} steps)`);
        for (const [index, step] of this.steps.entries()) {
            try {
                console.log(` [${index + 1}/${this.steps.length}] ${step.name}`);
                await step.execute(context);
            } catch (e){
                throw `Unable to complete setup "${this.name}". ${e}`;
            }
        }
    }
}

//TODO: DEBUG ONLY
const Env = {
    "username": "testing",
    "password": "P455W0rD",
};

class Job {
    constructor(name, repo, steps) {
        this.name = name;
        this.steps = steps;
        this.repo = repo;
        this.job_loc = `${this.name}_${(new Date()).toISOString()}`;
    }

    async runSteps(context) {
        console.log(`Running job "${this.name}" (${this.steps.length} steps)`);
        console.log(`Cloning repo`)
        await ssh(`git clone ${mustache.render(this.repo, Env)} ${this.job_loc}`, context, false, this.repo);
        for (const [index, step] of this.steps.entries()) {
            try {
                console.log(` [${index + 1}/${this.steps.length}] ${step.name}`);
                await step.execute(context);
            } catch (e){
                throw `Unable to complete job "${this.name}". ${e}`;
            }
        }
    }
}

class BuildFactory {
    constructor(yaml_string) {
        this.setup = new Array();
        this.jobs = new Map();
        this.doc = yaml.load(yaml_string);
    }

    parse() {
        if (!this.doc.hasOwnProperty("setup")) {
            throw 'Missing required field "setup" in yaml file';
        }

        if (!this.doc.hasOwnProperty("jobs")) {
            throw 'Missing required field "jobs" in yaml file';
        }

        for(const setup of this.doc.setup) {
            let steps = new Array();
            for (const step of setup.steps) {
                steps.push(new Step(step.name, step.run));
            }
             this.setup.push(new Setup(setup.name, steps));
        }

        for(const job of this.doc.jobs) {
            let steps = new Array();
            for(const step of job.steps) {
                steps.push(new Step(step.name, step.run));
            }
            this.jobs.set(job.name, new Job(job.name, job.repo, steps));
        }
    }
}


exports.handler = async argv => {
    let { job_name, build_file } = argv;

    console.log(chalk.green("Building environment..."));

    var obj = cp.execSync("bakerx ssh-info m1 --format json");
    var json = JSON.parse(obj);

    //await ssh(`sudo ansible-playbook /bakerx/lib/builds/${job_name}/${build_file}`, json);

    try {
        let factory = new BuildFactory(fs.readFileSync(build_file, 'utf8'))
        factory.parse();

        for (const setup of factory.setup) {
            await setup.runSteps(json);
        }

        factory.jobs.get(job_name).runSteps(json);
    } catch (e) {
        console.log(chalk.red(e));
    }
};
