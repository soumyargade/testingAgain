const yaml = require('js-yaml');
const {Step, Mutation, Snapshot} = require('./step');
const {Setup} = require('./setup');
const {Job} = require('./job')

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
            let j = new Job(job.name, job.repo);
            for(const [stage, obj] of Object.entries(job)) {
                switch (stage) {
                    case "name":
                    case "repo":
                        break;
                    case "build":
                        j.build(obj);
                        break;
                    case "deploy":
                        j.deploy(obj);
                        break;
                    default:
                        throw `Stage type "${stage}" was not recognized`;
                }
            }
            this.jobs.set(job.name, j);
        }
    }
}

module.exports = {
    BuildFactory,
};
