# Pipeline > Build
## Screencast
Link: [Insert Here].
## `.env` File Specifications
A local `.env` file must be created in the repo folder after the repo is cloned. It must have 3 variables defined in the following format:

```bash
username="unityid"
token="token"
root_pass="any_password"
```

In order for the build process to successfully clone the iTrust repo from the NCSU GitHub, you must put your **real unity id** and a **valid NCSU GitHub access token** in the place of "username" and "token". Any password consisting of numbers and letters can be put in the place of "any_password" for the root_pass as this password will be used for configuring the MySQL database.

## Milestone Report
[`CHECKPOINT.md`](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/CHECKPOINT-M1.md) details our team progress & issues faced all the way up until **March 2**.

Over the course of the next ~1 week leading up to the deadline for this milestone, we primarily worked on being able to successfully configure a build environment for the given build job specification. We ended up switching from using Ansible to `ssh` with double quotes & escaping. We finished adding the necessary `setup` and `job` steps to `test.yml` & then renamed this file to `build.yml` (ended up abandoning the [Ansible playbook version](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/lib/builds/itrust-build/build-ansible.yml) of this file that we had initially implemented, even though it is still present in the `/lib/builds/itrust-build` folder.

A issue we were running into was figuring out how to parse the variables present in the `.env` file in order to be able to clone the iTrust repo. We initially tried adding iTrust as a subfolder so it wouldn't need to be pulled from GitHub through the user's NCSU credentials within the `.env` file. However, we later realized that the variables in `.env` could be parsed if we changed their formatting a bit to be compatible with the `dotenv` library. We also used the `mustache` library for template replacement from the `.env` file. We were initially using `heredoc` in the ssh command but ran into the issue where one of our teammates with Windows OS was unable to run the commands with this feature present. Thus, we ended up removing `heredoc` in favor of quotes with escapes instead.

In order to ensure the build environment is clean after a build, we decided to create folders with specific names in which different build job will be run. This folder name is written to the environment variables in `job.js`. We decided to have the MySQL instance be set up & run in a docker container with the root password being set as part of the command. We also made a few more stylistic changes that included removing logging of potentially sensitive information & did some refactoring such that the four classes previously present in `build.js` got moved into their own files.

## Running the Code
1. Clone the repo & create a `.env` file containing the fields specified above.
2. Run `npm install` to install the necessary dependencies.
3. Run `node index.js init` to provision & configure the VM.
4. Run `node build itrust-build build.yml` to trigger a build job, running steps outlined by `build.yml`.

*Note*: To start up a server & test that it's running, uncomment the following line in `build.yml` prior to running step #4: `cd {{job_loc}}/iTrust2/ && mvn -q spring-boot:run`. Add a port forwarding to port 8080 (set both guest & host port to 8080) on the VM that was created in step #3 & then visit http://localhost:8080/iTrust2 on your host.

<img src="https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/img/iTrustBuild.png">
