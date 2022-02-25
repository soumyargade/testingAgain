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
        this.command = command;
    }

    execute(context) {
        try {
            ssh(this.command, context);
        } catch (e) {
            throw {name: "StepExecutionError", message: `Unable to complete step "${this.name}". ${e}`}
        }
    }
}

class Job {
    constructor(name, steps) {
        this.name = name;
        this.steps = steps;
    }

    runSteps(context) {
        for (const step of steps) {
            try {
                step.execute(context);
            } catch (e){
                throw {name: "JobExecutionError", message: `Unable to complete job "${this.name}". ${e}`};
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
        if (!"setup" in this.doc) {
            throw {name: "MissingSetupException", message: 'Missing required field "setup" in yaml file'};
        }

        if (!"jobs" in this.doc) {
            throw {name: "MissingJobsException", message: 'Missing required field "jobs" in yaml file'};
        }

        for(setup_step of this.doc.setup) {
            this.setup.push(new Step(setup_step, setup_step));
        }

        for(const job of this.doc.jobs) {
            let steps = new Array();
            for(const step of job.steps) {
                steps.push(new Step(step.name, step.command));
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

    await ssh(`sudo ansible-playbook /bakerx/lib/builds/${job_name}/${build_file}`, json);

    try {
        let factory = BuildFactory(fs.readFileSync(build_file, 'utf8')).parse();
        //TODO setup
        factory.jobs.runSteps(json);
    } catch (e) {
        console.log(chalk.red(e));
    }
};
