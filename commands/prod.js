const chalk = require('chalk');
const cp = require("child_process");
const fs = require("fs");
const ssh = require('../lib/exec/ssh');
const mustache = require('mustache');
const {BuildFactory} = require('./buildSetup/buildFactory');

const Env = process.env;


//TODO add build file to get provider type.
exports.command = 'prod [direction] [job_name] [build_file]';
exports.desc = 'Control Cloud Environment Provisioning';
exports.builder = yargs => {
    yargs.options({
    });
};

async function azure_up(json) {
    try {
        await ssh(mustache.render(`/bakerx/lib/scripts/cloud_provision.sh {{cloud_pass}} {{root_pass}} {{tenent}} {{cloud_username}}"`, Env), json);

    } catch (err) {
        console.log(chalk.red(`Error running cloud provisioning script \n ${e}`));
    }
}

async function azure_down(json) {
    try {
        await ssh(`az group delete -y -n csc519-devops-rg`, json);

    } catch (err) {
        console.log(chalk.red(`Error running cloud deprovisioning script \n ${e}`));
    }
}

async function local_up(json) {
    //TODO use bakerx to bring up some VMs, save inventory file
    throw Error("local provisioning is currently unimplemented.");
}

async function local_down(json) {
    //TODO use bakerx to tear down some VMs using implicit "inventory" file, remove inventory file.
    throw Error("local deprovisioning is currently unimplemented.");
}

exports.handler = async argv => {

    let { direction, job_name, build_file } = argv;

    var obj = cp.execSync("bakerx ssh-info m1 --format json");
    var json = JSON.parse(obj);
    let factory = new BuildFactory(fs.readFileSync(build_file, 'utf8'))
    factory.parse();
    let job = factory.jobs.get(job_name);
    const provider = job.deploy.deployment_scheme.provider;

    if (direction == "up") {
        
        ///////////////////////////////////////////////////////////////////////////
        //////////////////// PROVISION CLOUD RESOURCES ////////////////////////////
        ///////////////////////////////////////////////////////////////////////////

        console.log(chalk.green("Provisioning Cloud Servers..."));

        //TODO add parsing of build.yml file to get provider type.
        switch (provider) {
            case 'azure':
                if (!Env.hasOwnProperty("cloud_pass")) {
                    throw new Error(`Must have a "cloud_pass" key=value pair in the .env file`);
                }
                azure_up(json);
                break;
            case 'local':
                local_up(json);
                break;
            default:
                throw new TypeError(`Unsupported provider "${provider}"`);

        }
    } else if (direction == "down") {
        ///////////////////////////////////////////////////////////////////////////
        //////////////////// DEPROVISION CLOUD RESOURCES //////////////////////////
        ///////////////////////////////////////////////////////////////////////////
        switch (provider) {
            case 'azure':
                if (!Env.hasOwnProperty("cloud_pass")) {
                    throw new Error(`Must have a "cloud_pass" key=value pair in the .env file`);
                }
                azure_down(json);
                break;
            case 'local':
                local_down(json);
                break;
            default:
                throw new TypeError(`Unsupported provider "${provider}"`);

        }
    } else {
        console.log(chalk.red("Usage 'prod up' or 'prod down'"));
    }

}
