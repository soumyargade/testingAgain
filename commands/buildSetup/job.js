const ssh = require('../../lib/exec/ssh');
const mustache = require('mustache');

const {Step, Mutation, Snapshot} = require('./step');
const {Setup} = require('./setup');
const { ThrowStatement } = require('esprima');

const Env = process.env;

class Stage {
    constructor(obj) {
        if (obj.hasOwnProperty("setup")) {
            let steps = new Array();
            for(const setup of obj.setup) {
                for(const step of setup.steps) {
                    let s = new Step(step.name, step.run);
                    steps.push(s);
                }
            }
            this.setup = new Setup(obj.setup.name, steps);
        }
    }
}

class BuildStage extends Stage {
    constructor(obj) {
        super(obj);
        let build_steps = new Array();

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
        this.steps = build_steps;
    }

    async execute(context, job_loc) {
        if(this.hasOwnProperty("setup")) {
            console.log(` Setting up to build...`);
            await this.setup.execute(context, job_loc);
            console.log(` Set-up complete.`);
        }

        console.log(` Starting build...`);
        for( let [index, step] of this.steps.entries() ) {
            console.log(`  [${index + 1}/${this.steps.length}] ${step.name}`);
            await step.execute(context, job_loc);
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
        if(this.hasOwnProperty("setup")) {
            console.log(` Setting up to deploy...`);
            await this.setup.execute(context, job_loc);
            console.log(` Set-up complete.`);
        }

        console.log(` Deploying artifacts...`);
        await this.artifacts.place(context, job_loc); //TODO
        console.log(` Artifacts deployed.`);

        if(this.hasOwnProperty("init")) {
            console.log(` Initializing deployment...`);
            await this.init.execute();// TODO
            console.log(` Initialization complete.`);
        }

        console.log(` Starting deployed server...`);
        await this.run.execute(); //TODO
        console.log(` Deployed server started.`);
    }
}


class Job {
    constructor(name, repo, build, deploy) {
        this.name = name;
        this._build = build;
        this.repo = repo;
        this.job_loc = `${this.name}`;
        this._deploy = deploy;
    }

    build(build) {
        this._build = new BuildStage(build);
        return this;
    }

    deploy(deploy) {
        this._deploy = deploy;
        return this;
    }

    async runBuild(context) {
        Env.job_loc = this.job_loc; // Write the folder name to environment variables
        console.log(`Cloning repo...`);
        await ssh(`git clone ${mustache.render(this.repo, Env)} ${this.job_loc}`, context, false, this.repo);
        console.log(`Repo cloned.`);
        console.log(`Building job "${this.name}" (${this._build.steps.length} steps)...`);
        try {
            await this._build.execute(context, this.job_loc);
        } catch (e) {
            throw `Unable to build job "${this.name}". ${e}`;
        }
        console.log(`Building completed.`);
    }

    async runDeploy(context) {
        Env.job_loc = this.job_loc; // Write the folder name to environment variables
        console.log(`Deploying job "${this.name}"...`);
        await this._deploy.execute(context, job_loc);
        console.log(`Deployment complete.`);
    }
}

module.exports = {
    Job,
    Stage,
    BuildStage,
    DeployStage,
};
