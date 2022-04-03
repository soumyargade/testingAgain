const chalk = require("chalk");
const {Mutation} = require("./buildSetup/mutation");

exports.command = "mutate [input_file] [output_file] [mutation_count] [mutation_function]";
exports.desc = "Perform mutations on a file";
exports.build = (yargs) => {
    yargs.options({});
}

exports.handler = async (argv) => {
    let { inFile, outFile, mutationCount, mutationFunction } = argv;

    if (!mutationCount) {
        mutationCount = 1000;
    }
    if (!mutationFunction) {
        mutationFunction = random;
    }

    let mutation = new Mutation(inFile, outFile, mutationCount, mutationFunction);

    console.log(chalk.green(`File ${inFile} will be mutated ${mutationCount} times and the results placed into file ${outFile}`));

    mutation.mutate();

}