const ssh = require('../../lib/exec/ssh');
const mustache = require('mustache');
const spawn = require('../../lib/exec/spawn');

const {Step, Mutation, GreenBlue, DockerContainer} = require('./step');
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
        this.type = obj.type ? obj.type : 'green-blue';
        switch (this.type) {
            case 'green-blue':
                this.deployment_scheme = new GreenBlue("", obj.inventory, obj.provider, obj.artifacts, obj.steps);
                break;
            case 'docker-container':
                this.deployment_scheme = new DockerContainer(obj.steps);
                break;
            default:
                throw TypeError(`"${this.type}" is not a recognized deployment type.`);
        }
    }

    async execute(context, job_loc) {
        this.deployment_scheme.execute(context, job_loc);
    }
}

class TestStage extends Stage {
    constructor(obj) {
        super(obj);
        let test_steps = new Array();
        for (const step of obj.steps) {
            test_steps.push(new Step(step.name, step.run));
        }
        this.steps = test_steps;
    }

    async execute(context, job_loc) {
        for( let [index, step] of this.steps.entries() ) {
            console.log(`  [${index + 1}/${this.steps.length}] ${step.name}`);
            await step.execute(context, job_loc);
        }
    }
}

class AnalysisStage {
    constructor(obj) {
        this.folder = obj.pylint.folder;
        let astFiles = new Array();
        for (const file in obj.astModule.analyze) {
            astFiles.push(obj.astModule.analyze[file]);
        }
        this.astFiles = astFiles;
        let setup_steps = new Array();
        for (const step of obj.setup.steps) {
            let s = new Step(step.name, step.run);
            setup_steps.push(s);
        }
        this.setup = new Setup(obj.setup.name, setup_steps);
    }

    async execute(context, job_loc) {
        await this.setup.execute(context, job_loc);
        await ssh(`sudo cp /bakerx/support/astModule.py /home/vagrant`, context);
        for (const file in this.astFiles) {
            console.log(`File Under Analysis: ${this.astFiles[file]}` )
            await ssh(`python3 astModule.py ${this.astFiles[file]}`, context);
        }
        await ssh(`pylint ${this.folder}`, context);
    }
}

class Job {
    constructor(name, repo, build, deploy, test, analysis) {
        this.name = name;
        this._build = build;
        this.repo = repo;
        this.job_loc = `${this.name}`;
        this.test = test;
        this.deploy = deploy;
        this.analysis = analysis;
    }

    build(build) {
        this._build = new BuildStage(build);
        return this;
    }

    setDeploy(deploy) {
        this.deploy = new DeployStage(deploy);
        return this;
    }

    setTest(test) {
        this.test = new TestStage(test);
        return this;
    }

    setAnalysis(analysis) {
        this.analysis = new AnalysisStage(analysis);
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
        await this.deploy.execute(context, this.job_loc);
    }

    async runTests(context) {
        Env.job_loc = this.job_loc; // Write the folder name to environment variables
        console.log(`Testing job "${this.name}"...`);
        await this.test.execute(context, this.job_loc);
    }

    async runAnalysis(context) {
        Env.job_loc = this.job_loc; // Write the folder name to environment variables
        console.log(`Analyzing job "${this.name}"...`);
        await this.analysis.execute(context, this.job_loc);
    }
}

module.exports = {
    Job,
    Stage,
    BuildStage,
    DeployStage,
    AnalysisStage,
    TestStage
};
