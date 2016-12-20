---
id: cli
title: Jest CLI
layout: docs
category: Reference
permalink: docs/cli.html
---

Run `jest --help` to view the various options available.

It is possible to run test suites by providing a pattern. Only the files that the pattern matches will be picked up and executed.

If you have a test suite in a file named `Component-snapshot-test.js` somewhere in the file hierarchy, you can run only that test by adding a pattern right after the `jest` command:

```bash
jest Component-snapshot
```

It is possible to further limit the tests that will be run by using the `--testNamePattern` (or simply `-t`) flag.

```bash
jest Component-snapshot -t "is selected"
```

It is possible to combine the `--updateSnapshot` (`-u`) flag with the options above in order to re-record snapshots for particular test suites or tests only:

Update snapshots for all files matching the pattern:
```bash
jest -u Component-snapshot
```

Only update snapshots for tests matching the pattern:
```bash
jest -u Component-snapshot -t "is selected"
```

It is possible to specify which files the coverage report will be generated for.

```bash
jest --collectCoverageFrom='["packages/**/index.js", "!**/vendor/**"]' --coverage
```
