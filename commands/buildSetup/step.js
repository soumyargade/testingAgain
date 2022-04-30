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

class GreenBlue {
    constructor(name, inventory) {
        this.name = name;
        this.file = inventory;
    }

    async execute(context, project_dir) {
        var input = fs.readFileSync(`${this.file}`, 'utf-8');
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
