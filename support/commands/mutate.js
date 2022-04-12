const chalk = require("chalk");
const {Mutation} = require("../lib/mutation");

exports.command = "mutate [file_glob]";
exports.desc = "Perform mutations on a file";
exports.builder = (yargs) => {
    yargs.options({
        output_directory: {
            alias: 'o',
            describe: 'output directory',
            default: '.',
            type: "string"
        },
        mutation_function: {
            alias: 'f',
            describe: 'the mutation function to apply',
            default: 'random',
            type: 'string'
        }
    });
}

exports.handler = async (argv) => {
    let { file_glob, output_directory, mutation_function} = argv;

    let mutation = new Mutation(file_glob, output_directory, mutation_function);

    mutation.mutate();

}
