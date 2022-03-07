const ssh = require('../lib/exec/ssh');
const mustache = require('mustache');

const Env = process.env;

class Job {
    constructor(name, repo, steps) {
        this.name = name;
        this.steps = steps;
        this.repo = repo;
        this.job_loc = `${this.name}_${(new Date()).getTime()}`;
    }

    async runSteps(context) {
        Env.job_loc = this.job_loc; // Write the folder name to environment variables
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

module.exports = {
    Job,
};