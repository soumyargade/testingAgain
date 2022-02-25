// Borrowed from homework V and modified
const chalk = require("chalk");
const exec = require('child_process').exec;

module.exports = async function(cmd, json) {

    let sshExe = `ssh ${json.user}@${json.hostname} -i "${json.private_key}" -p ${json.port} -o StrictHostKeyChecking=no`;

    return new Promise(function (resolve, _reject) { 
        const full_cmd = `${sshExe} "${cmd}"`;
        console.log( chalk.yellow(full_cmd) );
        exec(full_cmd, (error, stdout, stderr) => {

            console.log(error || stderr);
            console.log(stdout);
            resolve()

        });
    });
}
