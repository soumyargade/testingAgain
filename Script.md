Today I will demonstrate the new mutation step that was added to the M2 release of the pipeline application.

This new step-type allows anyone to run mutations on their current code. The user can specify the number of iterations that will occur. 

Each iteration starts from the original code, selects a file that matches any of the globs given in the `mutate` section and applies a 
random mutation. The suite of tests can then be run with this mutated code. The snapshot substep allows the user to specify any urls 
from which to collect screenshots that will then be compared against the screenshots from the original. 

As you can see, running a build job that contains this mutation step is the same as running any other step-type in pipeline. Just `pipeline init`,
and then `pipeline build` with the job name and the file that contains the job. It is important to rerun pipeline init, if you already have an
existing version of the pipeline VM running. 

In this case, the `mutation-coverage` job was set to run 1000 iterations. We will resume when it is complete.

Now that the job is complete, you can see the results from the job. These same results will be printed in the `coverage_report` file in 
the root of the output directory.

If we look in the output directory, you will see the coverage report file, the log of mutations that were applied, the original unmutated 
code and the screenshots that were taken using the unmodified code. There is also a single folder for each iteration that was requested. 

In each of these folders there is the mutated code file and the associated screenshots. Sometimes these screenshots will be unable to 
be retrieved. This is likely due to a server error, and the coverage report indicates that. 

This has been a look at the mutation step in the pipeline application. Thanks for watching.
