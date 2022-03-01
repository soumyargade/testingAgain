
## Current Progress
* [x] Automatically provision & configure build server.
* [x] Create build job specification (completed with an Ansible Playbook solution, but still WIP for custom solution).
* [ ] Automatically configure build environment for given build job specification.

We have provisioned & configured a build server in our `init.js` file using `bakerx`. Each team member tested it out on their system (as each has different OS i.e. Mac, Windows, Linux) and was able to confirm that the VM `m1` is successfully created when `pipeline init` is run on the CLI. Although `init.js` may need to be updated later on depending upon our final configuration of `build.yml` and `build.js`, the majority of the functionality is in place. *Note*: After suggestions from [Dr.Parnin](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/pull/13#issuecomment-91230), we migrated all of the build server bootstrapping code we previously had in `init.js` to a new file, `bakerx.yml`.

We have created a [build job](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/lib/builds/itrust-build/build.yml) specification in the form of an Ansible Playbook solution, but are currently working on creating a new `build.yml` file that we feel will be more in line with the project description, containing both a `setup` and `jobs` object. This more [custom solution](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/test.yml) is currently named `test.yml` & we have verified that the `setup` and `jobs` objects present in this file are able to be parsed by the various classes we have created within `build.js` (a stylistic change we plan to make in the future involves placing these classes into their own separate files.). We were also able to confirm that the steps present in the `jobs` object are able to run within a container on the VM. Our next step is to transfer the rest of the configurations over from `build.yml` to `test.yml` and rename this file to serve as our official build job specification.

## Issues Faced
We have faced several issues so far in the project, including:

1. Choosing an appropriate format for the ```build.yml``` file. We wrote and tested a full Ansible playbook to set up the build environment inside a Docker container. The Ansible [build.yml](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/lib/builds/itrust-build/build.yml) resides in /lib/builds/itrust-build/. We are going back and writing a new ```build.yml``` file (currently named [test.yml](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/test.yml)) that we feel more closely aligns with the project specifications.

2. Choosing an interpreter for the ```build.yml``` file. Originally, we expected to use Ansible to interpret the ```build.yml``` file since the file would be an Ansible Playbook. Now that we are writing a custom ```build.yml```, we are writing custom functions to parse the ```build.yml``` file and interpret it accordingly. We still plan to use some Ansible CLI commands in our solution because they provide an effective means of running privileged commands in the build environment (a Docker container). 

3. Authenticating against the NCSU Github in order to download iTrust. At this point, we have not found an alternative solution to using true NCSU credentials to authenticate against the NCSU Github instance in order to download the iTrust repository into the build environment. Our solution calls for these credentials to be provided in the `.env` file where the solution will parse and use them in git calls to the NCSU Github.

4. A minor issue during the implementation of the Ansible solution was achieving **indempotency** for some commands. Several commands, such as updating the database password in the ```/iTrust2-v10/iTrust2/src/main/resources/application.yml``` file, are executed directly in bash in the build enviroment. Without checking if the file has already been updated, running the Playbook multiple times would result in adding the database password multiple times, rendering the file useless.

## Team Contributions
Our team has been keeping track of tasks to complete (which are linked to issues & pull requests) in our [M1 Planning project board](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/projects/1). Each major task has had a team member responsible for implementing the majority of the assigned task.
* **Tanner**: provision build server VM & create Ansible `build.yml`.
* **Edwin**: configure `build` object in `test.yml` & find Ansible provider.
* **Soumya**: configure `setup` object in `test.yml` & write documentation.

<img src="https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/img/projectBoard.png">
