const chalk = require('chalk');
const fs = require('fs');
const cp = require("child_process");
const yaml = require('js-yaml');
const {Step} = require('../commands/step');
const {Setup} = require('../commands/setup');
const {Job} = require('../commands/job')

const Env = process.env;

exports.command = 'build [job_name] [build_file]';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};

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

    if (Env.hasOwnProperty("password")) {
        Env.password = encodeURIComponent(Env.password); //encode the GitHub password so the user doesn't have to.
        // Using this mechanism to access github has been disabled in github proper and probably for good reason. 
    }

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
