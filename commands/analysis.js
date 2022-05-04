const chalk = require('chalk');
const cp = require("child_process");
const fs = require('fs');
const { BuildFactory } = require('./buildSetup/buildFactory');


exports.command = 'analysis [job_name] [build_file]';
exports.desc = 'Run static analysis tools';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async _argv => {

    let { job_name, build_file } = _argv;

    console.log(chalk.green("Running static analysis..."));

    var obj = cp.execSync("bakerx ssh-info m1 --format json");
    var json = JSON.parse(obj);

    try {
        let factory = new BuildFactory(fs.readFileSync(build_file, 'utf8'))
        factory.parse();

        factory.jobs.get(job_name).runAnalysis(json);
    } catch (e) {
        console.log(chalk.red(e));
    }
}