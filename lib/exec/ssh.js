// Borrowed from homework V and modified
const path = require('path');
const os   = require('os');
const chalk = require("chalk");
const exec = require('child_process').exec;

module.exports = async function(cmd, json) {

    let sshExe = `ssh ${json.user}@${json.hostname} -i "${json.private_key}" -p ${json.port} -o StrictHostKeyChecking=no`;

    return new Promise(function (resolve, reject) { 
        console.log( chalk.yellow(`${sshExe} ${cmd}`) );
        exec(`${sshExe} ${cmd}`, (error, stdout, stderr) => {

            console.log(error || stderr);
            console.log(stdout);
            resolve()

        });
    });
}
