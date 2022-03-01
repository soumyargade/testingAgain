const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const cp = require("child_process");
const ansible = require('../lib/exec/ansible');
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
        this.command = command;
    }

    async execute(context) {
        try {
            await ansible(this.command, context);
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
            this.jobs.set(job.name, new Job(job.name, steps));
        }
    }
}


exports.handler = async argv => {
    let { job_name, build_file } = argv;

    console.log(chalk.green("Building environment..."));


    var obj = cp.execSync("bakerx ssh-info m1 --format json");
    var json = JSON.parse(obj);


    try {
        // create ephemeral job container
        await ssh(`sudo docker run -t -d --rm --name ${job_name} ubuntu:focal`, json)

        // Read the build file
        let factory = new BuildFactory(fs.readFileSync(build_file, 'utf8'))
        factory.parse();

        // Complete all setup steps
        for (const setup of factory.setup) {
            await setup.runSteps(json);
        }

        // Run only the requested job
        await factory.jobs.get(job_name).runSteps(json);

        // Get rid of the ephemeral container (eventually artifacts will be written
        // to the host by way of a volume mounted for the job within the /bakerx 
        // folder that is mounted using `--sync` within bakerx).
        await ssh(`sudo docker stop ${job_name}`, json)

    } catch (e) {
        console.log(chalk.red(e));
    }
};
