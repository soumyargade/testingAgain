const chalk = require('chalk');
const path = require('path');

exports.command = 'build';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { processor } = argv;

    console.log(chalk.green("Building environment..."));
   
};