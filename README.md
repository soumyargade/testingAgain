# Pipeline > Build, Test & Analysis, Deploy
## Screencasts
**M3** screencast can be viewed [here](update_this_link).

**M2** screencast can be viewed [here](https://drive.google.com/file/d/1W9nbQ9ne_URjutOwgRIg5QyTh2OmraXx/view?usp=sharing).

**M1** screencast can be viewed [here](https://drive.google.com/file/d/1aFCotNPFiHQq-daBrSUp6U9fjBSPcWk4/view?usp=sharing).

## `.env` File Specifications
TODO: add parameters for Azure account access.

A local `.env` file must be created in the repo folder after the repo is cloned. 

The variables defined must match the mustache-template `{{parameters}}` in the YAML file to be passed to `pipeline build`.

A parameter key of `password` will be assumed to be a GitHub password and special characters will be properly escaped for 
use in a URL. 

*Update*: for M3, the `cloud_username`, `cloud_pass`, & `tenent` variables have been added & will need to be updated with your corresponding Azure account credentials. If you do not have an Azure account, please reach out to our team & we will provide our own credentials for your use in recreating the prod & deploy steps.

```bash
username="unityid"
token="token"
root_pass="any_password"
cloud_username="your_Azure_username"
cloud_pass="your_Azure_password"
tenent="your_Azure_tenent"
```

In order for the build process to successfully clone the iTrust repo from the 
NCSU GitHub, you must put your **real unity id** and a **valid NCSU GitHub access token** 
in the place of "username" and "token". Any password consisting of numbers and 
letters can be put in the place of "any_password" for the root_pass as this 
password will be used for configuring the MySQL database.

## Milestone Report M3
TODO: document the design of your deployment strategy & experiences you have in designing & implementing your provisioning step and deployment strategy.

## Milestone Report M2
We first worked on generating initial baseline snapshots of the files in the test suite which included `long.md`, `survey.md`, `upload.md`, & `variations.md`. This was largely done through following the example implementation of a headless browser image-based snapshot provided in the instructions for this milestone by the teaching staff that made use of the `puppeteer` library. We then implemented eight mutation operators in the newly created file `mutationOperations.js` which include constant replacement, non-empty string, clone return, conditional expression mutation, control flow mutation, conditional boundary mutations, incrementals, & negate conditionals. We added a mutation-coverage job to our `build.yml` which mutates `marqdown.js` for a total of 1000 iterations.

Our initial implementation of the test harness was creating a separate folder for each round of mutations (labelled something like mutation0, mutation1, etc.) but we later switched to having a single `test-output` folder to hold the results of each mutation. This folder includes the initial baseline snapshots (labelled `long.md.png`, `survey.md.png`, etc.) as well as the snapshots generated with the mutated code (labelled `long.md0.png`, `surveymd0.png`, etc. with the number at the end of the file name increasing with each round of mutations). The images which illustrate the difference in baseline versus mutated snapshot are also stored in the `test-output` folder labeled as `variations.md.png`, `variations.md0.png`, etc. However, prior to submission we switched *back* to creating a folder for each mutation as it made it easier to see which iterations had failed for debugging purposes & mutation coverage.

One of the issues we ran into involved being able to fork the `node index.js` process on the guest as once we started the microservice it was hanging waiting on the previously run `ssh` command to return. This was solved by running `ssh` through a newly added `cp.spawn` command as opposed to through `cp.exec`. We also modified a few function calls to create the directory & start the microservice as a background process in order to avoid having other processes waiting for it to return to start. Another issue involved trying to debug the cause of certain `ERR_CONNECTION_REFUSED` & `MODULE_NOT_FOUND` error which were popping up repeatedly in the build output. The solution involved measures such as adding a `sleep` command in various locations (ex: prior to taking snapshots) & modifying the way in which we were passing arguments to the `spawn` command.

Because of the massive number of files within the single output directory, we decided to once again use the mutation iteration folders within the output directory. The root of the output directory contains the files from the unmutated original file and the sub directories contain the output and mutated files for each iterations. The details of what were changed can be found the the `mutations.log` file in the root of the output directory. A report with the coverage statistics can also be found in the root of the output directory. 

## Milestone Report M1
[`CHECKPOINT-M1.md`](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/CHECKPOINT-M1.md) details our team progress & issues faced all the way up until **March 2**.

Over the course of the next ~1 week leading up to the deadline for this milestone, we primarily worked on being able to successfully configure a build environment for the given build job specification. We ended up switching from using Ansible to `ssh` with double quotes & escaping. We finished adding the necessary `setup` and `job` steps to `test.yml` & then renamed this file to `build.yml` (ended up abandoning the [Ansible playbook version](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/lib/builds/itrust-build/build-ansible.yml) of this file that we had initially implemented, even though it is still present in the `/lib/builds/itrust-build` folder.

A issue we were running into was figuring out how to parse the variables present in the `.env` file in order to be able to clone the iTrust repo. We initially tried adding iTrust as a subfolder so it wouldn't need to be pulled from GitHub through the user's NCSU credentials within the `.env` file. However, we later realized that the variables in `.env` could be parsed if we changed their formatting a bit to be compatible with the `dotenv` library. We also used the `mustache` library for template replacement from the `.env` file. We were initially using `heredoc` in the ssh command but ran into the issue where one of our teammates with Windows OS was unable to run the commands with this feature present. Thus, we ended up removing `heredoc` in favor of quotes with escapes instead.

In order to ensure the build environment is clean after a build, we decided to create folders with specific names in which different build jobs will be run. This folder name is written to the environment variables in `job.js`. We decided to have the MySQL instance be set up & run in a docker container with the root password being set as part of the command. Near the end of the milestone, we made a few stylistic changes that included removing logging of potentially sensitive information (useful for when recording the screencast) & did some refactoring such that the four classes previously present in `build.js` got moved into their own files.

## Running the Code M3
1. Clone the repo & create a `.env` file containing the fields specified above.
2. Run `npm install` to install the necessary dependencies.
3. Run `node index.js init` to provision & configure the VM.
4. Run `node index.js build itrust-build build.yml`.
5. Run `node index.js build mutation-coverage build.yml` (optional).
6. Run `node index.js prod up itrust-build build.yml` to provision instances on Azure.
7. Run `node index.js deploy inventory itrust-deploy build.yml` to deploy. *Note*: You will need to wait 1-2 minutes before running this in order to give time for the instances to be provisioned on Azure from the previous step.
8. Run `node index.js prod down itrust-build build.yml` to destroy instances (optional).

## Running the Code M2
1. Clone the repo & create a `.env` file containing the fields specified above.
2. Run `npm install` to install the necessary dependencies.
3. Run `node index.js init` to provision & configure the VM.
4. Run `node index.js build itrust-build build.yml` (optional).
5. Run `node index.js build mutation-coverage build.yml`.

## Running the Code M1
1. Clone the repo & create a `.env` file containing the fields specified above.
2. Run `npm install` to install the necessary dependencies.
3. Run `node index.js init` to provision & configure the VM.
4. Run `node index.js build itrust-build build.yml` to trigger a build job, running steps outlined by `build.yml`.

*Note*: To start up a server & test that it's running, uncomment the following line in `build.yml` prior to running step #4: `cd {{job_loc}}/iTrust2/ && mvn -q spring-boot:run`. Add a port forwarding to port 8080 (set both guest & host port to 8080) on the VM that was created in step #3 & then visit http://localhost:8080/iTrust2 on your host.

<img src="https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/img/iTrustBuild.png">
