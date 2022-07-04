---
id: environment-variables
title: Environment Variables
---

Jest sets the following environment variables:

### `NODE_ENV`

Set to `'test'` if it's not already set to something else.

### `JEST_WORKER_ID`

Each worker process is assigned a unique id (index-based that starts with `1`). This is set to `1` for all tests when [`runInBand`](CLI.md#--runinband) is set to true.

### `JEST_MAX_WORKERS`

Specifies the maximum number of workers the worker-pool will spawn for running tests. This will override regular configuration options, but can be overridden by [the `--maxWorkers` argument]('CLI#--maxworkersnumstring).
