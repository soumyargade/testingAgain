
## Current Progress
* [x] Automatically provision & configure build server.
* [x] Create build job specification. (Complete with an Ansible Playbook solution - in progress for custom solution)
* [ ] Automatically configure build environment for given build job specification.

## Issues Faced
We have faced several issues so far in the project, including:

1. Choosing an appropriate format for the ```build.yml``` file. We wrote and tested a full Ansible playbook to set up the build environment inside a Docker container. The Ansible [build.yml](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/lib/builds/itrust-build/build.yml) is resides in /lib/builds/itrust-build/. We are going back and writing a new ```build.yml``` file (currently [test.yml](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/test.yml)) that we feel more closely aligns with the project specifications.

2. Choosing an interpreter for the ```build.yml``` file. Originally, we expected to use Ansible to interpret the ```build.yml``` file since the file would be an Ansible Playbook. Now that we are writing a custom ```build.yml```, we are writing custom functions to parse the ```build.yml``` file and interpret it accordingly. We still plan to use some Ansible CLI commands in our solution because they provide an effective means of running privileged commands in the build environment (a Docker container). 

3. Authenticating against the NCSU Github in order to download iTrust. At this point, we have not found an alternative solution to using true NCSU credentials to authenticate against the NCSU Github instance in order to download the iTrust repository into the build environment. Our solution calls for these credentials to be provided in the .env file where the solution will parse and use them in git calls to the NCSU Github.

4. A minor issue during the implementation of the Ansible solution was achieving indempotency for some commands. Several commands, such as updating the database password in the ```/iTrust2-v10/iTrust2/src/main/resources/application.yml``` file, are executed directly in bash in the build enviroment. Without checking if the file has already been updated, running the Playbook multiple times would result in adding the database password multiple times, rendering the file useless.

## Team Contributions
Add screenshots of GitHub Project.
