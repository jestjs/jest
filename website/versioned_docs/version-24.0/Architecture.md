---
id: version-24.0-architecture
title: Architecture
original_id: architecture
---

If you are interested in learning more about how Jest works, what the architecture behind the framework is, and how Jest is split up into individual reusable packages, check out this video:

<iframe width="560" height="315" src="https://www.youtube.com/embed/3YDiloj8_d0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

# Tests ordering and parallelization

Jest can make decisions regarding tests ordering and how it is going to apply parallelization to such tests.

After gathering all tests it is supposed to run (based on, for instance, the command executed), it gathers important information to decide on the executing order.

Currently, some heuristics are:

- Has it failed during the last run?

- How long did this test took to run?

- What is the test file size?

Tests that have previously failed and tests that take the longest time get scheduled to run first.

If that information is not yet available, Jest gives priority to larger test files.

> **Note: The order in which tests are executed can change between different test runs.**

Regarding parallelization, Jest has the following rules:

- If `--runInBand` is not provided, Jest will decide if individual files will be executed in parallel or not based on a performance evaluation. If provided, all tests will be executed in a serial fashion using just one process.
- All `describe` and `test` blocks **within a file** always run in serial, in declaration order.
