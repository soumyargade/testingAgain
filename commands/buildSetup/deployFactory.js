const yaml = require('js-yaml');
const {Step, Mutation, Snapshot} = require('./step');
const {Job} = require('./job')

class DeployFactory {
    constructor(yaml_string) {
        this.jobs = new Map();
        this.doc = yaml.load(yaml_string);
    }

    parse() {
        for (const job of this.doc.jobs) {
            let j = new Job(job.name, job.repo);
            for(const [stage, obj] of Object.entries(job)) {
                if (stage == "deploy") {
                    j.deploy(obj);
                }
            }
            this.jobs.set(job.name, j);
        }
    }
}

module.exports = {
    DeployFactory,
};