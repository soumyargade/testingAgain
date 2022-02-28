// Borrowed from homework V (ssh) and modified
const chalk = require("chalk");
const exec = require('child_process').exec;
const ssh = require('./ssh');


export class Ansible {
    constructor(connection_info) {
        this.connection_info = connection_info;
    }

    async run_command(command) {
        // Use a heredoc to enable multiline commands along with more complex quoting
        // NOTE: it is important that there is NO INDENTATION in subsequent lines
        full_command = `ansible localhost -b -m shell -a "$(cat << 'EOF'
${command}
EOF
)"`;
        await ssh(full_command, this.connection_info);
    }

}

