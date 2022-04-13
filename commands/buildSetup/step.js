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
        let cmd = `mkdir -p ${working_dir} && cd ${working_dir} && ${this.command}`;
        spawn(cmd, context); // remove await so following processes aren't waiting on this one to return
        await ssh(`while ! lsof -nP -iTCP -sTCP:LISTEN | grep -q "^node.*3000"; do : ; done`, context); // give enough time for server to come up on port 3000
        // FIXME: Some assumptions are being made above: 1) this is a node application 2) it is listening on port 3000
        //          These assumptions can probably be mitigated either from explicit attributes being added to yaml file OR by inferring from the existing information. 

        // Collect snapshots (assume web-app)
        // Collect DOM and/or PNG for diff-ing
        let promises = new Array();
        for ( let u of this.collect ) {
            promises.push( ssh(`cd ${working_dir} && node /bakerx/support/index.js screenshot ${u} ${u.split('/').pop()}`, context));
        }
        // run all the snapshots at the same time and wait for them all
        await Promise.all(promises);
        await ssh(`killall node`, context);
    }
}
class Mutation extends Step {
    constructor(name, files_to_mutate, iterations, init, snapshots) {
        super(name);
        this.to_mutate = files_to_mutate;
        this.num_iterations = iterations;
        this.init = init;
        this.snapshots = snapshots;
    }

    async execute(context, project_dir) {
        //TODO: we might be able to be more clever with how we use async/await here
        //      so we can get multiple things going at the same time.
        if(this.init !== false) {
            await ssh(`cd ${project_dir} && ${this.init}`, context);
        }

        // run original code and collect snapshots
        await this.snapshots.execute(context, project_dir);
        for(let i = 0; i < this.num_iterations; i++) {
            // Run mutation code on the remote node. A hidden folder is to prevent compounded, recursive copying.
            await ssh(`cd ${project_dir} && mkdir -p .mutation_${i} && cp -r * .mutation_${i} && node /bakerx/support/index.js mutate -o '.mutation_${i}' '${this.to_mutate}'`, context);
            // Run the command in the mutated code directory and collect the snapshots
            await this.snapshots.execute(context, `${project_dir}/.mutation_${i}`);
        }
    }
}

module.exports = {
    Step,
    Mutation,
    Snapshot,
};
