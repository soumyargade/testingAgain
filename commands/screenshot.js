const puppeteer = require('puppeteer');
const fs = require('fs');

exports.command = 'screenshot [url] [filename]';
exports.desc = 'Take a screenshot of a url';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    let { url, filename } = argv;

    filename = `${filename}.png`;

    const browser = await puppeteer.launch({
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    await page.goto(url, {
        waitUntil: 'networkidle0'
    });

    await page.screenshot({
        path: filename,
        fullPage: true
    });

    await page.close();
    await browser.close();
};
