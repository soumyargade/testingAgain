const chalk = require('chalk');
const cp = require("child_process");
const ssh = require('../lib/exec/ssh');
const mustache = require('mustache');

const Env = process.env;


exports.command = 'prod [direction]';
exports.desc = 'Control Cloud Environment Provisioning';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {

    let { direction } = argv;

    var obj = cp.execSync("bakerx ssh-info m1 --format json");
    var json = JSON.parse(obj);

    if (direction == "up") {
        
        ///////////////////////////////////////////////////////////////////////////
        //////////////////// PROVISION CLOUD RESOURCES ////////////////////////////
        ///////////////////////////////////////////////////////////////////////////

        console.log(chalk.green("Provisioning Cloud Servers..."));

        if (!Env.hasOwnProperty("cloud_pass")) {
            throw new Error(`Must have a "cloud_pass" key=value pair in the .env file`);
        }
        try {
            await ssh(`/bakerx/lib/scripts/cloud_provision.sh ${mustache.render("{{cloud_pass}}", Env)} ${mustache.render("{{root_pass}}", Env)} ${mustache.render("{{tenent}}", Env)} ${mustache.render("{{cloud_username}}", Env)}`, json);

        } catch (err) {
            console.log(chalk.red(`Error running cloud provisioning script \n ${e}`));
        }
    } else if (direction == "down") {
        ///////////////////////////////////////////////////////////////////////////
        //////////////////// DEPROVISION CLOUD RESOURCES //////////////////////////
        ///////////////////////////////////////////////////////////////////////////
        try {
          await ssh(`az group delete -y -n csc519-devops-rg`, json);
    
        } catch (err) {
            console.log(chalk.red(`Error running cloud deprovisioning script \n ${e}`));
        }
    } else {
        console.log(chalk.red("Usage 'prod up' or 'prod down'"));
    }

}
