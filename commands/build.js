const chalk = require('chalk');
const path = require('path');
const cp = require("child_process");
const ssh = require('../lib/exec/ssh');

exports.command = 'build [job_name] [build_file]';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    let { job_name, build_file } = argv;

    console.log(chalk.green("Building environment..."));

    var obj = await cp.execSync("bakerx ssh-info m1 --format json");
    var json = JSON.parse(obj);

    await ssh(`sudo ansible-playbook -vv /bakerx/lib/builds/${job_name}/${build_file}`, json);
   
};