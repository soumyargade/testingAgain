const chalk = require('chalk');
const path = require('path');
const process = require('child_process');
const fs = require('fs');


exports.command = 'init';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { processor } = argv;

    console.log(chalk.green("Preparing computing environment..."));

    console.log(chalk.green(`Downloading focal image for ${processor}...`))
if (processor == "Intel/Amd64") {
    // use bakerx
    try {
        // pull image
        await process.execSync("bakerx pull focal cloud-images.ubuntu.com");
        // provision and start vm
        console.log(chalk.green("Configuring and starting vm with bakerx..."))
        await process.execSync("bakerx run m1 focal --memory 2048")

        // pull and parse the vm info including username, ip and path to ssh key
        var obj = await process.execSync("bakerx ssh-info m1 --format json");
        var json = JSON.parse(obj);
        const userName = `USERNAME=${json.user}`;
        const IP = `IP=${json.hostname}`;
        const sshPath = `SSHPATH=${json.private_key}`;
        const envOutput = `${userName}\n${IP}\n${sshPath}`;
        console.log(envOutput);

        // write variables to .env file
        fs.writeFileSync('../.env', envOutput, err => {
            if (err) {
                console.error(err);
            }
        })
    } catch {
        console.log(chalk.red("Error pulling focal image with bakerx!"))
    }
    
} else {
    console.log("Processor type unsupported");
}
};