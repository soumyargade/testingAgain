const chalk = require("chalk");
const {Mutation} = require("./buildSetup/mutation");

exports.command = "mutate [input_file] [output_file] [mutation_function]";
exports.desc = "Perform mutations on a file";
exports.builder = (yargs) => {
    yargs.options({});
}

exports.handler = async (argv) => {
    let { input_file, output_file, mutation_function } = argv;

    if (!mutation_function) {
        mutation_function = "random";
    }

    let mutation = new Mutation(input_file, output_file, mutation_function);

    console.log(chalk.green(`File ${input_file} will be mutated results placed into file ${output_file}`));

    mutation.mutate();

}