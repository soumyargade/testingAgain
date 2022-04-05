const chalk = require("chalk");
const {Mutation} = require("./buildSetup/mutation");

exports.command = "mutate [file_glob] [output_file] [mutation_function]";
exports.desc = "Perform mutations on a file";
exports.builder = (yargs) => {
    yargs.options({});
}

exports.handler = async (argv) => {
    let { file_glob, output_file, mutation_function} = argv;

    if (!mutation_function) {
        mutation_function = "random";
    }



    let mutation = new Mutation(file_glob, output_file, mutation_function);

    // console.log(chalk.green(`File ${file_glob} will be mutated results placed into file ${output_file}`));

    mutation.mutate();

}