// Borrowed from homework V and modified
const chalk = require("chalk");
const exec = require('child_process').exec;

module.exports = async function(cmd, json, display=true) {

    let sshExe = `ssh ${json.user}@${json.hostname} -i "${json.private_key}" -p ${json.port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`;

    return new Promise(function (resolve, _reject) { 
        const full_cmd = `${sshExe} "$(cat << 'EOF'
${cmd}
EOF
)"`;
        if (display) {
            console.log( chalk.yellow(full_cmd) );
        }
        exec(full_cmd, (error, stdout, stderr) => {

            console.log(chalk.grey(error || stderr));
            console.log(chalk.grey(stdout));
            resolve()

        });
    });
}
