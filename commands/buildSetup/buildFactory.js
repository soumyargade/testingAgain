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
            let steps = new Array();
            for(const step of job.steps) {
                if (step.hasOwnProperty("mutation")) {
                    steps.push(new Mutation(
                        step.name, 
                        step.mutation.mutate, 
                        step.mutation.iterations, 
                        step.mutation.init ?? false,
                        step.mutation.snapshot.run,
                        step.mutation.snapshot.collect
                    ));
                } else {
                    steps.push(new Step(step.name, step.run));
                }
            }
            this.jobs.set(job.name, new Job(job.name, job.repo, steps));
        }
    }
}

module.exports = {
    BuildFactory,
};
