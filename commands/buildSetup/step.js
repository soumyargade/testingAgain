const ssh = require('../../lib/exec/ssh');
const mustache = require('mustache');
const spawn = require('../../lib/exec/spawn');

const Env = process.env;

class Step {
    constructor(name, command) {
        this.name = name;
        this.command = (command) ? command.replace(/"/g, '\\"') : false; //escape '"'
    }

    async execute(context, _project_dir) {
        try {
            if(this.command !== false) {
                await ssh(mustache.render(this.command, Env), context, true, this.command);
            }
        } catch (e) {
            throw `Unable to complete step "${this.name}". ${e}`;
        }
    }
}

class Snapshot {
    constructor(command, collect) {
        this.command = command;
        this.collect = collect;
    }

    async execute(context, working_dir) {
        let cmd = `mkdir -p ${working_dir} ; cd ${working_dir} ; ${this.command}`;
        spawn(cmd, context); // remove await so following processes aren't waiting on this one to return

        // Collect snapshots (assume web-app)
        // Collect DOM and/or PNG for diff-ing
        for ( let u of this.collect ) {
            await ssh(`cd ${working_dir} && node /bakerx/support/index.js screenshot ${u} snapshot`, context);
        }
        await ssh(`cd ${working_dir} && kill $(pgrep node)`, context);
        await ssh(`node --version`, context);
    }
}
class Mutation extends Step {
    constructor(name, files_to_mutate, iterations, snapshots) {
        super(name);
        this.to_mutate = files_to_mutate;
        this.num_iterations = iterations;
        this.snapshots = snapshots;
    }

    async execute(context, project_dir) {
        //TODO: we might be able to be more clever with how we use async/await here
        //      so we can get multiple things going at the same time.

        // run original code and collect snapshots
        await this.snapshots.execute(context, project_dir);
        for(let i = 0; i < this.num_iterations; i++) {
            // Run mutation code on the remote node
            await ssh(`cd ${project_dir} && node /bakerx/support/index.js mutate -o 'mutation_${i}' '${this.to_mutate}'`, context);
            // Run the command in the mutated code directory and collect the snapshots
            await this.snapshots.execute(context, `${project_dir}/mutation_${i}`);
        }
    }
}

module.exports = {
    Step,
    Mutation,
    Snapshot,
};
