# Pipeline-Template

A local .env file must be created in the repo folder after the repo is cloned. The .env file must have three variables defined in the following format:

```bash
username="unityid"
token="token"
root_pass="any_password"
```

In order for the build process to successfully clone the iTrust repo from the NCSU github, you must put your real unity id and a valid NCSU Github access token in the place of "username" and "token". Any password consisting of numbers and letters can be put in the place of "any_password" for the root_pass as this password will be used for configuring the MySQL database.
