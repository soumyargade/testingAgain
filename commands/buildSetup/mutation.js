const {MutationOperations} = require('../../lib/exec/mutationOperations');

class Mutation {
    constructor(inFile, outFile, operation) {
        this.inFile = inFile;
        this.outFile = outFile;
        this.operation = operation;
    }

    async mutate() {
        try {
            MutationOperations.rewrite(this.inFile, this.outFile, this.operation);
        } catch (e) {
            throw `Unable to perform mutation operations. ${e}`;
        }
    }
}

module.exports = {
    Mutation
}