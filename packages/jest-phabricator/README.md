# jest-phabricator

This Repo contains the testResultsProcessor needed to create the coverage map needed by Phabricator to show inline coverage at diff time.

## How to use it

In `example/JestUnitTestEngine` you'll find an example of a Phabricator Jest UnitTestEngine reference implementation.

You need to add the jest unit engine to your .arcconfig:

```json
...

"unit.engine" : "JestUnitTestEngine",

...
```

In `JestUnitTestEngine` there are a couple of constants you probably need to modify:

- `PROCESSOR` points to the path or the processor
- `JEST_PATH` is the path to Jest

If you need to pass to Jest a custom configuration you can either use `JEST_PATH` and point it to a bash/script file that will just jest with `--config=path/to/config` or alternatively you can add the config option in the `getJestOptions` php function.
