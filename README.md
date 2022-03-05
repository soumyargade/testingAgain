# Pipeline-Template

A local .env file must be created in the repo folder after the repo is cloned. The .env file must have three variables defined in json format:

```bash
username="unityid"
password="ncsu_password"
root_pass="any_password"
```

In order for the build process to successfully clone the iTrust repo from the NCSU github, you must put your real unity id and NCSU password in the place of "username" and "password". Any password consisting of numbers and letters can be put in the place of "any_password" for the root_pass as this password will be used for configuring the MySQL database.
