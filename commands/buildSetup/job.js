const ssh = require('../../lib/exec/ssh');
const mustache = require('mustache');

const Step = require('./step');

const Env = process.env;

class Stage {
    constructor(obj) {
        this.setup = obj.setup;
    }

    async execute(context, job_loc);
}

class BuildStage extends Stage {
    constructor(obj) {
        super(obj);
        for(const step of obj.steps) {
            if (step.hasOwnProperty("mutation")) {
                build_steps.push(new Mutation(
                    step.name, 
                    step.mutation.mutate, 
                    step.mutation.iterations, 
                    step.mutation.init ?? false,
                    step.mutation.snapshot.run,
                    step.mutation.snapshot.collect
                ));
            } else {
                build_steps.push(new Step(step.name, step.run));
            }
        }
        this.steps = obj.steps;
    }

    async execute(context, job_loc) {
        console.log(` Setting up to build...`);
        this.setup.execute(context, job_loc);
        console.log(` Set-up complete.`);

        console.log(` Starting build...`);
        for( let [index, step] of this.steps.entries() ) {
            console.log(`  [${index + 1}/${this.steps.length}] ${step.name}`);
            step.execute(context, job_loc);
        }
        console.log(` Build complete.`);
    }
}

class DeployStage extends Stage {
    constructor(obj) {
        super(obj);
        this.artifacts = obj.artifacts;
        this.init = obj.init;
        this.run = obj.run;
    }

    async execute(context, job_loc) {
        console.log(` Setting up to deploy...`);
        this.setup.execute(context, job_loc);
        console.log(` Set-up complete.`);

        console.log(` Deploying artifacts...`);
        this.artifacts.place(context, job_loc);
        console.log(` Artifacts deployed.`);

        console.log(` Initializing deployment...`);
        this.init.execute();
        console.log(` Initialization complete.`);

        console.log(` Starting deployed server...`);
        this.run.execute();
        console.log(` Deployed server started.`);
    }
}


class Job {
    constructor(name, repo, build, deploy) {
        this.name = name;
        this._build = build;
        this.repo = repo;
        this.job_loc = `${this.name}_${(new Date()).getTime()}`;
        this._deploy = deploy;
    }

    function build(build) {
        this._build = new BuildStage(build);
        return this;
    }

    function deploy(deploy) {
        this._deploy = deploy
        return this
    }

    async runBuild(context) {
        Env.job_loc = this.job_loc; // Write the folder name to environment variables
        console.log(`Cloning repo...`);
        await ssh(`git clone ${mustache.render(this.repo, Env)} ${this.job_loc}`, context, false, this.repo);
        console.log(`Repo cloned.`);
        console.log(`Building job "${this.name}" (${this.steps.length} steps)...`);
        try {
            this._build.execute(context, job_loc);
        } catch (e) {
            throw `Unable to build job "${this.name}". ${e}`;
        }
        console.log(`Building completed.`);
    }

    async runDeploy(context) {
        Env.job_loc = this.job_loc; // Write the folder name to environment variables
        console.log(`Deploying job "${this.name}"...`);
        this._deploy.execute(context, job_loc);
        console.log(`Deployment complete.`);
    }
}

module.exports = {
    Job,
    Stage,
    BuildStage,
    DeployStage,
};
