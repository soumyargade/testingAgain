class Setup {
    constructor(name, steps) {
        this.name = name;
        this.steps = steps;
    }

    async execute(context) {
        console.log(`Running setup "${this.name}" (${this.steps.length} steps)`);
        for (const [index, step] of this.steps.entries()) {
            try {
                console.log(` [${index + 1}/${this.steps.length}] ${step.name}`);
                await step.execute(context);
            } catch (e){
                throw `Unable to complete setup "${this.name}". ${e}`;
            }
        }
    }
}

module.exports = {
    Setup,
};
