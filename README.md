# Pipeline > Build, Test & Analysis
## Screencasts
**M2** screencast can be viewed [here]().

**M1** screencast can be viewed [here](https://drive.google.com/file/d/1aFCotNPFiHQq-daBrSUp6U9fjBSPcWk4/view?usp=sharing).
## `.env` File Specifications
A local `.env` file must be created in the repo folder after the repo is cloned. It must have 3 variables defined in the following format:

```bash
username="unityid"
token="token"
root_pass="any_password"
```

In order for the build process to successfully clone the iTrust repo from the NCSU GitHub, you must put your **real unity id** and a **valid NCSU GitHub access token** in the place of "username" and "token". Any password consisting of numbers and letters can be put in the place of "any_password" for the root_pass as this password will be used for configuring the MySQL database.

## Milestone Report M2
We first worked on generating initial baseline snapshots of the files in the test suite which included `long.md`, `survey.md`, `upload.md`, & `variations.md`. This was largely done through following the example implementation of a headless browser image-based snapshot provided in the instructions for this milestone by the teaching staff that made use of the `puppeteer` library. We then implemented eight mutation operators in the newly created file `mutationOperations.js` which includes constant replacement, non-empty string, clone return, conditional expression mutation, control flow mutation, conditional boundary mutations, incrementals, & negate conditionals.

## Milestone Report M1
[`CHECKPOINT-M1.md`](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/CHECKPOINT-M1.md) details our team progress & issues faced all the way up until **March 2**.

Over the course of the next ~1 week leading up to the deadline for this milestone, we primarily worked on being able to successfully configure a build environment for the given build job specification. We ended up switching from using Ansible to `ssh` with double quotes & escaping. We finished adding the necessary `setup` and `job` steps to `test.yml` & then renamed this file to `build.yml` (ended up abandoning the [Ansible playbook version](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/lib/builds/itrust-build/build-ansible.yml) of this file that we had initially implemented, even though it is still present in the `/lib/builds/itrust-build` folder.

A issue we were running into was figuring out how to parse the variables present in the `.env` file in order to be able to clone the iTrust repo. We initially tried adding iTrust as a subfolder so it wouldn't need to be pulled from GitHub through the user's NCSU credentials within the `.env` file. However, we later realized that the variables in `.env` could be parsed if we changed their formatting a bit to be compatible with the `dotenv` library. We also used the `mustache` library for template replacement from the `.env` file. We were initially using `heredoc` in the ssh command but ran into the issue where one of our teammates with Windows OS was unable to run the commands with this feature present. Thus, we ended up removing `heredoc` in favor of quotes with escapes instead.

In order to ensure the build environment is clean after a build, we decided to create folders with specific names in which different build jobs will be run. This folder name is written to the environment variables in `job.js`. We decided to have the MySQL instance be set up & run in a docker container with the root password being set as part of the command. Near the end of the milestone, we made a few stylistic changes that included removing logging of potentially sensitive information (useful for when recording the screencast) & did some refactoring such that the four classes previously present in `build.js` got moved into their own files.

## Running the Code M2
1. Clone the repo & create a `.env` file containing the fields specified above.
2. Run `npm install` to install the necessary dependencies.
3. Run `node index.js init` to provision & configure the VM.
4. Run `node index.js build itrust-build build.yml`.
5. Run `node index.js build mutation-coverage build.yml`.

## Running the Code M1
1. Clone the repo & create a `.env` file containing the fields specified above.
2. Run `npm install` to install the necessary dependencies.
3. Run `node index.js init` to provision & configure the VM.
4. Run `node index.js build itrust-build build.yml` to trigger a build job, running steps outlined by `build.yml`.

*Note*: To start up a server & test that it's running, uncomment the following line in `build.yml` prior to running step #4: `cd {{job_loc}}/iTrust2/ && mvn -q spring-boot:run`. Add a port forwarding to port 8080 (set both guest & host port to 8080) on the VM that was created in step #3 & then visit http://localhost:8080/iTrust2 on your host.

<img src="https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/img/iTrustBuild.png">
