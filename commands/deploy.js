const chalk = require('chalk');
const cp = require("child_process");
const ssh = require('../lib/exec/ssh');
const spawn = require('../lib/exec/spawn');
const fs = require('fs');
const { BuildFactory } = require('./buildSetup/buildFactory');
const { DeployFactory } = require('./buildSetup/deployFactory');

const Env = process.env;


exports.command = 'deploy inventory [job_name] [build_file]';
exports.desc = 'Deploy build to cloud servers';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async _argv => {

    let { job_name, build_file } = _argv;

    console.log(chalk.green("Deploying environment..."));

    // console.log(chalk.green("Obtaining cloud inventory file..."));

    var obj = cp.execSync("bakerx ssh-info m1 --format json");
    var json = JSON.parse(obj);

    var input = fs.readFileSync("inventory", 'utf-8');
    var inventory = JSON.parse(input);

    let green = inventory.green;
    let blue = inventory.blue;

    try {
        let factory = new DeployFactory(fs.readFileSync(build_file, 'utf8'))
        factory.parse();
        // console.log(factory.jobs);
        factory.jobs.get(job_name).runDeploy(json);
    } catch (e) {
        console.log(chalk.red(e));
    }

    // try {
    //     console.log(chalk.green("Loading deployment file onto production servers..."));
    //     await ssh(`rsync -e 'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null' ~/itrust-build/iTrust2/target/iTrust2-10.jar ${green.admin}@${green.ip}:`, json);
    //     await ssh(`rsync -e 'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null' ~/itrust-build/iTrust2/target/iTrust2-10.jar ${blue.admin}@${blue.ip}:`, json);
        
    //     // Has to be run from the guest so the ssh keys match
    //     console.log(chalk.green("Starting application on production servers..."));        
    //     spawn(`ssh ${green.admin}@${green.ip} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null java -jar iTrust2-10.jar`, json)
    //     spawn(`ssh ${blue.admin}@${blue.ip} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null java -jar iTrust2-10.jar`, json)
        
    //     // Delay starting the healthcheck so the deployed servers can be started
    //     setTimeout((function(){
    //         let child = cp.spawn("node index.js healthcheck",[green.ip, blue.ip, inventory.lbip],{shell: true, detached: true, stdio: 'ignore'});

    //         child.unref();
    //     }),6000)

    // } catch (err) {
    //     console.log(chalk.red(e));
    // }
}