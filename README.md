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

Over the course of the next ~1 week leading up to the deadline for this milestone, we primarily worked on being able to successfully configure a build environment for the given build job specification.

## Running the Code
1. Clone the repo & create a `.env` file containing the fields specified above.
2. Run `npm install` to install the necessary dependencies.
3. Run `node index.js init` to provision & configure the VM.
4. Run `node build itrust-build build.yml` to trigger a build job, running steps outlined by `build.yml`.

*Note*: To start up a server & test that it's running, uncomment the following line in `build.yml` prior to running step #4: `cd {{job_loc}}/iTrust2/ && mvn -q spring-boot:run`. Add a port forwarding to port 8080 (set both guest & host port to 8080) on the VM that was created in step #3 & then visit http://localhost:8080/iTrust2 on your host.

<img src="https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-10/blob/main/img/iTrustBuild.png">
