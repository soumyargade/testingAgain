const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const cp = require("child_process");
const ssh = require('../lib/exec/ssh');
const yaml = require('js-yaml');

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
            await ssh(this.command, context);
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

class Job {
    constructor(name, steps) {
        this.name = name;
        this.steps = steps;
    }

    async runSteps(context) {
        console.log(`Running job "${this.name}" (${this.steps.length} steps)`);
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
        this.jobs = new Array();
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
            this.jobs.push(new Job(job.name, steps));
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

        for(const job of factory.jobs) {
            await job.runSteps(json); 
        }
    } catch (e) {
        console.log(chalk.red(e));
    }
};
