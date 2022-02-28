// Borrowed from homework V and modified
const chalk = require("chalk");
const exec = require('child_process').exec;

module.exports = async function(cmd, json) {

    let sshExe = `ssh ${json.user}@${json.hostname} -i "${json.private_key}" -p ${json.port} -o StrictHostKeyChecking=no`;

    return new Promise(function (resolve, _reject) { 
        // Use a heredoc to enable multiline commands along with more complex quoting
        // NOTE: it is important that there is NO INDENTATION in subsequent lines
        const full_cmd = `${sshExe} "$(cat << 'EOSSH'
${cmd}
EOSSH
)"`;

        console.log( chalk.yellow(full_cmd) );
        exec(full_cmd, (error, stdout, stderr) => {

            console.log(chalk.grey(error || stderr));
            console.log(chalk.grey(stdout));
            resolve()

        });
    });
}
