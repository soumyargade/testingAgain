# Pipeline-Template

A local .env file must be created in the repo folder after the repo is cloned. The .env file must have three variables defined in json format:
```
username="unityid"
password="ncsu_password"
root_pass="any_password"
```
In order for the build process to successfully clone the iTrust repo from the NCSU github, you must put your real unity id and NCSU password in the place of "unityid" and "ncsu_password". Any password consisting of numbers and letters can be put in the place of "any_password" for the root_password as this password will be used for configuring the MySQL database. 

One additional note about entering your NCSU password: if the password has special characters, they must be replaced with the following codes:
```
 !   #   $   &   '   (   )   *   +   ,   /   :   ;   =   ?   @   [   ]

%21 %23 %24 %26 %27 %28 %29 %2A %2B %2C %2F %3A %3B %3D %3F %40 %5B %5D
```
For example, if your NCSU password was "p@ssword!", you should enter the password in the .env file as "p%40ssword%21". This allows the parser to not be thrown off by special characters.