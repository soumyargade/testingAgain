const chalk = require('chalk');
const got = require('got');
const cp = require("child_process");

const ssh = require('../lib/exec/ssh');

exports.command = 'healthcheck [greenip] [blueip] [loadbalancerip]';
exports.desc = 'Start healthcheck tool';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    const {greenip, blueip, loadbalancerip} = argv;

    (async () => {
        await run(greenip, blueip, loadbalancerip);
    })();
}

class HealthCheck
{
    constructor(GREEN, BLUE, IP)
    {
        this.GREEN = GREEN;
        this.BLUE = BLUE;
        this.TARGET = IP;
        this.failoverTriggered = false;
        setInterval( this.healthCheck.bind(this), 6000 );
    }




    failover()
    {
        var obj = cp.execSync("bakerx ssh-info m1 --format json");
        var json = JSON.parse(obj);
        // Add BlueVM to load balancer pool
        ssh(`az network nic ip-config address-pool add -g csc519-devops-rg --lb-name rg0_lb --address-pool BackendPool1 --ip-config-name ipconfig1 --nic-name BlueVM_nic`, json);
        // Remove GreenVM from load balancer pool
        ssh(`az network nic ip-config address-pool remove -g csc519-devops-rg --lb-name rg0_lb --address-pool BackendPool1 --ip-config-name ipconfig1 --nic-name GreenVM_nic`, json);
        this.failoverTriggered = true;
    }

    async healthCheck()
    {
        try {
            const response = await got(`http://${this.TARGET}:8080/iTrust2`, {throwHttpErrors: false, timeout: 3000})

            let status = response.statusCode == 200 ? chalk.green(response.statusCode) : chalk.red(response.statusCode);

            if (response.statusCode == 500) {
                console.log(chalk.red("Error detected on primary server, failing over to backup..."));                
                this.failover();
            }

            console.log(chalk.gray(`Health check on ${this.TARGET}: ${status}`));
        } catch (error){
            if (!this.failoverTriggered) {
                console.log(chalk.red("Error detected on primary server, failing over to backup..."));
                this.failover();
            } else {
                console.log("Fatal error probably requiring manual action:");
                console.log("Error name: " + error.name);
                console.log(error);
            }
        }
    }

}


async function run(greenip, blueip, loadbalancerip) {

    console.log(chalk.keyword('pink')('Starting healthcheck'));

    let healthCheck = new HealthCheck(greenip, blueip, loadbalancerip);

}
