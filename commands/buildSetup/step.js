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


        // Create a test output folder and a backup folder
        await ssh(`cd ${project_dir} && mkdir test-output backup`, context);
        // Rewrite the files with escodegen so they can be more easily compared to the mutated files
        await ssh(`cd ${project_dir} && find -maxdepth 0 -name "${this.to_mutate}" -type f -exec node /bakerx/support/index.js mutate -f none -o "{}" "{}" \\; && cp ${this.to_mutate} backup`, context);

        // run original code and collect snapshots
        await this.snapshots.execute(context, project_dir, '');

        // mutate code and take snapshots with the mutated code in place
        for(let i = 0; i < this.num_iterations; i++) {
            // Run mutation code on the remote node.
            //await ssh(`cd ${project_dir} && cp ${this.to_mutate} backup`, context); // Backup the files we're going to mutate

            await ssh(`cd ${project_dir} && find -maxdepth 0 -name "${this.to_mutate}" -exec node /bakerx/support/index.js mutate -o "{}" "{}" \\;`, context); // Mutate the file(s)
            await this.snapshots.execute(context, project_dir, i);             // Run the mutated file(s) and collect the snapshots
            // Save mutated files in test-output and restore the original files
            await ssh(`set -x && cd ${project_dir} && ls -al && find -maxdepth 0 -name "${this.to_mutate}" -exec mv {} "test-output/{}.${i}" \\; && cp backup/${this.to_mutate} ./`, context);
            // await ssh(`cd ${project_dir} && mv ${this.to_mutate} test-output/${this.to_mutate}.${i} && mv ${this.to_mutate}.backup ${this.to_mutate}`, context);
        }



        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////     CLEANUP   /////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////

        await ssh(`cd ${project_dir} && sudo rm -r backup`, context); // Remove the backups folder


        /////////////////////////////////////////////////////////////////////////////////
        /////////////////////////// COVERAGE REPORT /////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////

        await ssh(`cd ${project_dir}/test-output/ && touch coverage_report`, context);
        // this.snapshots.collect.forEach(u => {
        for (const u of this.snapshots.collect) {
            let filename = u.slice(u.lastIndexOf("/") + 1);
            let png_name = `${filename}.png`
            await ssh(`cd ${project_dir}/test-output/ && /bakerx/lib/scripts/coverage_report.sh ${png_name} '${filename}*' ${this.num_iterations} | tee -a coverage_report`, context);
        }

        await ssh(`cd ${project_dir} && mkdir -p /bakerx/output && cp test-output/* /bakerx/output`, context); // Copy test files to host

    }
}

module.exports = {
    Step,
    Mutation,
    Snapshot,
};
