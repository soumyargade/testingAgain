const chalk = require('chalk');
const cp = require("child_process");
const ssh = require('../lib/exec/ssh');
const mustache = require('mustache');

const Env = process.env;


exports.command = 'prod down';
exports.desc = 'Deprovision Cloud Environment';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async _argv => {

    console.log(chalk.green("Deprovisioning Cloud Servers..."));

    var obj = cp.execSync("bakerx ssh-info m1 --format json");
    var json = JSON.parse(obj);

    if (!Env.hasOwnProperty("cloud_pass")) {
        throw new Error(`Must have a "cloud_pass" key=value pair in the .env file`);
    }

    ///////////////////////////////////////////////////////////////////////////
    //////////////////// DEPROVISION CLOUD RESOURCES //////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    try {
        console.log("deprovision");
//       await ssh(`az group delete -n csc519-devops-rg`, json);

    } catch (err) {
        console.log(chalk.red(`Error running cloud deprovisioning script \n ${e}`));
    }
}