const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const cp = require("child_process");
const ssh = require('../lib/exec/ssh');
const yaml = require('js-yaml');
const mustache = require('mustache');
const dotenv = require('dotenv').config;

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