const {MutationOperations} = require('./mutationOperations');

class Mutation {
    constructor(fileGlob, outPath, operation) {
        this.fileGlob = fileGlob;
        this.outPath = outPath;
        this.operation = operation;
    }

    async mutate() {
        try {
            MutationOperations.rewrite(this.fileGlob, this.outPath, this.operation);
        } catch (e) {
            throw `Unable to perform mutation operations. ${e}`;
        }
    }
}

module.exports = {
    Mutation
}
