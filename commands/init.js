const chalk = require("chalk");
const path = require("path");
const cp = require("child_process");
const waitssh = require('waitssh');

exports.command = "init";
exports.desc = "Prepare tool";
exports.builder = (yargs) => {
  yargs.options({});
};

exports.handler = async (argv) => {
  const { processor } = argv;

  console.log(chalk.green("Preparing computing environment..."));

  if (processor == "Intel/Amd64") {
    // use bakerx
    console.log(chalk.green(`Downloading focal image for ${processor}...`));

    // pull image
    try {
      await cp.execSync("bakerx pull focal cloud-images.ubuntu.com");
    } catch {
      console.log(chalk.red("Error pulling focal image with bakerx!"));
    }

    // provision and start vm
    try {
      console.log(chalk.green("Configuring and starting vm with bakerx..."));
      await cp.execSync("bakerx run m1 focal --memory 1024");
    } catch {
      console.log(chalk.red("Error starting vm with bakerx!"));
    }

    // pull and parse the vm info including username, ip and path to ssh key
    var json;
    try {
      var obj = await cp.execSync("bakerx ssh-info m1 --format json");
      json = JSON.parse(obj);
      console.log(`USERNAME=${json.user}`);
      console.log(`IP=${json.hostname}`);
      console.log(`SSHPATH=${json.private_key}`);
    } catch {
      console.log(chalk.red("Error obtaining vm details from bakerx!"));
    }

    //TODO: Add tools to build server
    try {
        await waitssh({port: json.port, hostname: json.hostname});
    } catch (error) {
        console.error(error);
    }

    async function ssh(cmd, sshExe) {
        return new Promise(function (resolve, reject) { 
            console.log( chalk.yellow(`${sshExe} ${cmd}`) );
            cp.exec(`${sshExe} ${cmd}`, (error, stdout, stderr) => {
    
                console.log(error || stderr);
                console.log(stdout);
                resolve()
    
            });
        });
    }

    try {
        let sshCmd = `ssh ${json.user}@${json.hostname} -i "${json.private_key}" -p ${json.port} -o StrictHostKeyChecking=no`;
        await ssh(`sudo apt update -y`, sshCmd);
        await ssh(`sudo apt install ansible -y`, sshCmd);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }

  } else {
    console.log("Processor type unsupported");
    process.exit(1);
  }
};
