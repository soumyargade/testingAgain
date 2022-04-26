const chalk = require('chalk');
const cp = require("child_process");
const ssh = require('../lib/exec/ssh');
const mustache = require('mustache');

const Env = process.env;


exports.command = 'prod up';
exports.desc = 'Provision Cloud Environment';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async _argv => {

    console.log(chalk.green("Provisioning Cloud Servers..."));

    var obj = cp.execSync("bakerx ssh-info m1 --format json");
    var json = JSON.parse(obj);

    if (!Env.hasOwnProperty("cloud_pass")) {
        throw new Error(`Must have a "cloud_pass" key=value pair in the .env file`);
    }

    ///////////////////////////////////////////////////////////////////////////
    //////////////////// PROVISION CLOUD RESOURCES ////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    try {
       await ssh(`/bakerx/lib/scripts/cloud_provision.sh ${mustache.render("{{cloud_pass}}", Env)} ${mustache.render("{{root_pass}}", Env)}`, json);

    } catch (err) {
        console.log(chalk.red(`Error running cloud provisioning script \n ${e}`));
    }
}
