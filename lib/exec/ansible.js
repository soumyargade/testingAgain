// Borrowed from homework V (ssh) and modified
const ssh = require('./ssh');


module.exports = async function(command, connection_info) {
    // Use a heredoc to enable multiline commands along with more complex quoting
    // NOTE: it is important that there is NO INDENTATION in subsequent lines
    full_command = `ansible localhost --become --module-name "ansible.builtin.shell" --args "$(cat << 'EOA'
${command}
EOA
)"`;
    await ssh(full_command, connection_info);
}


