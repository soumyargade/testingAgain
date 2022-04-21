const chalk = require('chalk');
const fs = require('fs');
const cp = require("child_process");
const {BuildFactory} = require('./buildSetup/buildFactory')

const Env = process.env;

exports.command = 'build [job_name] [build_file]';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    let { job_name, build_file } = argv;

    console.log(chalk.green("Building environment..."));

    var obj = cp.execSync("bakerx ssh-info m1 --format json");
    var json = JSON.parse(obj);

    if (Env.hasOwnProperty("password")) {
        Env.password = encodeURIComponent(Env.password); //encode the GitHub password so the user doesn't have to.
        // Using this mechanism to access github has been disabled in github proper and probably for good reason. 
    }

    try {
        let factory = new BuildFactory(fs.readFileSync(build_file, 'utf8'))
        factory.parse();

        for (const setup of factory.setup) {
            await setup.execute(json);
        }
        factory.jobs.get(job_name).runBuild(json);
    } catch (e) {
        console.log(chalk.red(e));
    }
};
