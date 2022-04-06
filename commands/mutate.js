const chalk = require("chalk");
const {Mutation} = require("./buildSetup/mutation");

exports.command = "mutate [file_glob] [mutation_function]";
exports.desc = "Perform mutations on a file";
exports.builder = (yargs) => {
    yargs.options({
        output: {
            alias: 'o',
            describe: 'output directory',
            default: '.',
            type: "string"
        }
    });
}

exports.handler = async (argv) => {
    let { file_glob, o, mutation_function} = argv;

    if (!mutation_function) {
        mutation_function = "random";
    }



    let mutation = new Mutation(file_glob, o, mutation_function);

    // console.log(chalk.green(`File ${file_glob} will be mutated results placed into file ${output_file}`));

    mutation.mutate();

}