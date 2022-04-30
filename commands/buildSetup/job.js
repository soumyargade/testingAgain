const ssh = require('../../lib/exec/ssh');
const mustache = require('mustache');
const fs = require('fs');
const cp = require("child_process");
const spawn = require('../../lib/exec/spawn');

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
        let deploy_steps = new Array();
        for (const step of obj.steps) {
            deploy_steps.push(new Step(step.name, step.run));
        }
        this.steps = deploy_steps;
    }

    async execute(context, job_loc) {

        var input = fs.readFileSync("inventory", 'utf-8');
        var inventory = JSON.parse(input);
        let green = inventory.green;
        let blue = inventory.blue;

        await ssh(`rsync -e 'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null' ~/itrust-build/iTrust2/target/iTrust2-10.jar ${green.admin}@${green.ip}:`, context);
        await ssh(`rsync -e 'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null' ~/itrust-build/iTrust2/target/iTrust2-10.jar ${blue.admin}@${blue.ip}:`, context);

        spawn(`ssh ${green.admin}@${green.ip} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null java -jar iTrust2-10.jar`, context)
        spawn(`ssh ${blue.admin}@${blue.ip} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null java -jar iTrust2-10.jar`, context)

        setTimeout((function(){
            let child = cp.spawn("node index.js healthcheck",[green.ip, blue.ip, inventory.lbip],{shell: true, detached: true, stdio: 'ignore'});

            child.unref();
        }),6000)

        for( let [index, step] of this.steps.entries() ) {
            console.log(`  [${index + 1}/${this.steps.length}] ${step.name}`);
            await step.execute(context, job_loc);
        }
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
        this._deploy = new DeployStage(deploy);
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
        await this._deploy.execute(context, this.job_loc);
        console.log(`Deployment complete.`);
    }
}

module.exports = {
    Job,
    Stage,
    BuildStage,
    DeployStage,
};
