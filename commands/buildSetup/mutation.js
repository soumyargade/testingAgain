const {MutationOperations} = require('../../lib/exec/mutationOperations');

class Mutation {
    constructor(inFile, outFile, count, operation) {
        this.inFile = inFile;
        this.outFile = outFile;
        this.count = count;
        this.operation = operation;
    }

    async mutate() {
        try {
            MutationOperations.rewrite(this.inFile, this.outFile, this.count, this.operation);
        } catch (e) {
            throw `Unable to perform mutation operations. ${e}`;
        }
    }
}

module.exports = {
    Mutation
}