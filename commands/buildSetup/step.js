const ssh = require('../../lib/exec/ssh');
const mustache = require('mustache');

const Env = process.env;

class Step {
    constructor(name, command) {
        this.name = name;
        this.command = (command) ? command.replace(/"/g, '\\"') : false; //escape '"'
    }

    async execute(context) {
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

    async execute(context) {
        //TODO: Run command
        //TODO: Collect snapshots (assume web-app)
        //      Collect DOM and PNG for diff-ing
    }
}
class Mutation extends Step {
    constructor(name, files_to_mutate, iterations, snapshots) {
        super(name);
        this.to_mutate = files_to_mutate;
        this.num_iterations = iterations;
        this.snapshots = snapshots;
    }

    async execute(context) {
        for(i = 0; i < this.num_iterations; i++) {
            //TODO: mutate the code
            //TODO: Run the command in the mutated code directory
            //TODO: Collect the snapshots
        }
    }
}

module.exports = {
    Step,
    Mutation,
};
