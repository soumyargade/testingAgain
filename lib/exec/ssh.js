// Borrowed from homework V and P and modified
const chalk = require("chalk");
const exec = require('child_process').exec;

module.exports = async function(cmd, json, display=true, redacted) {

    let sshExe = `ssh ${json.user}@${json.hostname} -i "${json.private_key}" -p ${json.port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`;

    return new Promise(function (resolve, reject) { 
        const full_cmd = `${sshExe} "${cmd}"`;

        if(redacted) {
            console.log( chalk.yellow( redacted ));
        }
        else if (display) {
            console.log( chalk.yellow(full_cmd) );
        } 

        let subp = exec(full_cmd);

        if (display) {
            subp.stdout.on('data', stdout => {
                console.log(chalk.grey(stdout.toString()));
            });
            subp.stderr.on('data', stderr => {
                console.log(chalk.grey(stderr.toString()));
            });
        }

        subp.on('error', err => {
            console.log(chalk.red(err.message));
            reject(err);
        });
        subp.on('exit', code => {
            resolve(code);
        });

    });
}
