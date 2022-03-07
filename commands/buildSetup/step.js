const ssh = require('../../lib/exec/ssh');
const mustache = require('mustache');

const Env = process.env;

class Step {
    constructor(name, command) {
        this.name = name;
        this.command = command.replace(/"/g, '\\"'); //escape '"'
    }

    async execute(context) {
        try {
            await ssh(mustache.render(this.command, Env), context, true, this.command);
        } catch (e) {
            throw `Unable to complete step "${this.name}". ${e}`;
        }
    }
}

module.exports = {
    Step,
};