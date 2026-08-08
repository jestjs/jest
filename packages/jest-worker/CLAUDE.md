# `jest-worker` — agent notes

## How it works

`Worker` (the public class) composes `Farm` (scheduling) and `WorkerPool` (lifecycle). Methods exposed by the worker module are auto-detected from its exports (`exposedMethods` option overrides this). Methods starting with `_` are excluded. Each exposed method is bound on the `Worker` instance as `worker.methodName(...args): Promise<result>`.

Two pool backends, toggled by `enableWorkerThreads: true`:

- `ChildProcessWorker` — `child_process.fork`. Default; more isolated.
- `NodeThreadsWorker` — `worker_threads`. Lower overhead; shared memory available.

## Worker module contract

Any module used as a worker can optionally export:

- `setup()` — called once on first use before any method call. Async-ok.
- `teardown()` — called during `worker.end()`. Async-ok.
- Any number of exported functions — these become callable via the `Worker` instance.

From inside a worker, call `messageParent(data)` to send a custom message to the main process. The main process receives it via `worker.getStderr()` events or by registering `onCustomMessage` listeners on the farm.

## Key options

| Option | Purpose |
| --- | --- |
| `numWorkers` | Default: `availableParallelism() - 1` |
| `computeWorkerKey(method, ...args)` | Return a string → sticky routing (same key → same worker). Useful when workers cache state keyed to a file. |
| `workerSchedulingPolicy` | `'round-robin'` (default) or `'in-order'` |
| `maxRetries` | Retries on worker crash (default 3) |
| `idleMemoryLimit` | Restart workers that exceed this RSS (bytes) |
| `setupArgs` | Args passed to worker `setup()` |

## Hard rules

- Call `await worker.end()` when done — it drains the queue, sends `teardown()` to workers, and exits them. Not calling it leaks child processes.
- `computeWorkerKey` returning the same string for different inputs causes incorrect cache hits if the worker caches by key. Ensure the key captures all inputs that affect the result.
- Methods are **always async** from the caller's perspective regardless of whether the worker implementation is sync — `WorkerModule<T>` promisifies all methods.
