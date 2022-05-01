const ssh = require('../../lib/exec/ssh');
const mustache = require('mustache');
const spawn = require('../../lib/exec/spawn');
const fs = require('fs');
const cp = require("child_process");

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

    async execute(context, working_dir, file_suffix) {
        let cmd = `cd ${working_dir} && ${this.command}`;
        // let cmd = `${this.command}`;
        spawn(cmd, context); // remove await so following processes aren't waiting on this one to return
        await ssh(`while ! lsof -nP -iTCP -sTCP:LISTEN | grep -q "^node.*3000"; do : ; done`, context); // give enough time for server to come up on port 3000
        // FIXME: Some assumptions are being made above: 1) this is a node application 2) it is listening on port 3000
        //          These assumptions can probably be mitigated either from explicit attributes being added to yaml file OR by inferring from the existing information. 

        // Collect snapshots (assume web-app)
        // Collect DOM and/or PNG for diff-ing
        let promises = new Array();
        for ( let u of this.collect ) {
            let filename = u.split('/').pop();
            let newFilename = `${working_dir}/test-output/${filename + file_suffix}`;
            promises.push( ssh(`node /bakerx/support/index.js screenshot ${u} ${newFilename}`, context));
        }
        // run all the snapshots at the same time and wait for them all
        await Promise.all(promises);
        await ssh(`killall node`, context);
    }
}

class Provider {
    constructor(machine_info) {
        this.admin = machine_info.admin;
        this.ip = machine_info.ip;
    }

    async copy_file(source, dest, context) {
        ssh(`rsync -e 'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null' ${source} ${this.admin}@${this.ip}:${dest}`, context);
    }

    async run_command(command, context) {
        spawn(`ssh ${this.admin}@${this.ip} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${command}`, context)
    }
}
class Artifact {
    constructor(source, dest) {
        this.source = source;
        this.dest = dest;
    }
}
class GreenBlue {
    constructor(name, inventory, provider, artifacts, steps) {
        this.name = name;
        this.file = inventory;
        this.artifacts = new Array();
        this.steps = new Array();

        for (const artifact of this.artifacts) {
            this.artifacts.push(new Artifact(artifact.source, artifact.dest));
        }
        for (const step of this.steps) {
            this.steps.push(new Step(step.name, step.run));
        }

        var input = fs.readFileSync(`${this.file}`, 'utf-8');
        var inventory = JSON.parse(input);
        switch (provider) {
            case 'azure':
            case 'local':
                this.green = new Provider(inventory.green);
                this.blue= new Provider(inventory.blue);
        }
    }


    async execute(context, project_dir) {
        let copy_futures = new Array();
        for(const art of this.artifacts) {
            copy_futures.push(this.green.copy_file(art.source, art.dest, context));
            copy_futures.push(this.blue.copy_file(art.source, art.dest, context));
        }
        await Promise.all(copy_futures);

        for(const step of this.steps) {
            let step_futures = new Array();
            step_futures.push(this.green.run_command(this.step.run, context))
            step_futures.push(this.blue.run_command(this.step.run, context))
            await Promise.all(step_futures);
        }

        setTimeout((function(){
            let child = cp.spawn("node index.js healthcheck",[green.ip, blue.ip, inventory.lbip],{shell: true, detached: true, stdio: 'ignore'});

            child.unref();
        }),6000)
    }
}

class Mutation extends Step {
    constructor(name, files_to_mutate, iterations, init, command, collect) {
        super(name, command);
        this.to_mutate = files_to_mutate;
        this.num_iterations = iterations;
        this.init = init;
        this.collect = collect;
    }

    async execute(context, project_dir) {
        //TODO: we might be able to be more clever with how we use async/await here
        //      so we can get multiple things going at the same time.
        if(this.init !== false) {
            await ssh(`cd ${project_dir} && ${this.init}`, context);
        }

       await ssh(`cp /bakerx/support/run_mutations.sh ./run_mutations.sh && cp /bakerx/support/sed.sh ./sed.sh && ./sed.sh && chmod +x ./run_mutations.sh`, context);

        let url_cmd_str = "";
        for ( let u of this.collect ) {
            if (url_cmd_str.length != 0) {
                url_cmd_str += " ";
            }
            url_cmd_str += `-u "${u}"`;
        }

        let glob_cmd_str = "";
        for ( let g of this.to_mutate ) {
            if (glob_cmd_str.length != 0) {
                glob_cmd_str += " ";
            }
            glob_cmd_str += `"${g}"`;
        }

        await ssh(`sudo ~/run_mutations.sh -c '${this.command}' -o "/bakerx/output" -p "${project_dir}" -n "${this.num_iterations}" ${url_cmd_str} ${glob_cmd_str}`, context);
    }
}

module.exports = {
    Step,
    Mutation,
    Snapshot,
    GreenBlue,
};
