const chalk = require("chalk");
const path = require("path");
const process = require("child_process");
const fs = require("fs");

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
      await process.execSync("bakerx pull focal cloud-images.ubuntu.com");
    } catch {
      console.log(chalk.red("Error pulling focal image with bakerx!"));
    }

    // provision and start vm
    try {
      console.log(chalk.green("Configuring and starting vm with bakerx..."));
      await process.execSync("bakerx run m1 focal --memory 1024");
    } catch {
      console.log(chalk.red("Error starting vm with bakerx!"));
    }

    // pull and parse the vm info including username, ip and path to ssh key
    try {
      var obj = await process.execSync("bakerx ssh-info m1 --format json");
      var json = JSON.parse(obj);
      const userName = `USERNAME=${json.user}`;
      const IP = `IP=${json.hostname}`;
      const sshPath = `SSHPATH=${json.private_key}`;
      const envOutput = `${userName}\n${IP}\n${sshPath}`;
      console.log(envOutput);

      // write variables to .env file
      fs.writeFileSync("../.env", envOutput, (err) => {
        if (err) {
          console.error(
            chalk.red("Error writing environmental variables to .env file!")
          );
          console.error(chalk.red(err));
        }
      });
    } catch {
      console.log(chalk.red("Error obtaining environmental variables!"));
    }

    //TODO: Add tools to build server


  } else {
    console.log("Processor type unsupported");
    process.exit(1);
  }
};
