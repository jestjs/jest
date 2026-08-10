# `jest-circus` — agent notes

## Architecture

Event-driven. Each global (`describe`, `test`, `beforeEach`, …) synchronously calls `dispatchSync` into `state.ts`, building a `DescribeBlock`/`TestEntry` tree. `run.ts` then walks the tree asynchronously. `eventHandler.ts` is the primary handler; `addEventHandler(handler)` registers additional observers (handlers array lives on `globalThis[EVENT_HANDLERS]` so it survives module isolation).

The entry point for `jest-runner` is `legacy-code-todo-rewrite/jestAdapterInit.ts`: it installs globals, wires snapshot state, runs `setupFilesAfterFramework`, then calls `run()` and converts the result to a `TestResult`.

## Non-obvious behaviours

**`describe` callbacks must be synchronous.** Returning a Promise throws immediately. Use `beforeAll` for async setup.

**`test.failing` inverts at the dispatch layer.** A throwing body → `test_fn_success`; a passing body → `test_fn_failure`. `jest-snapshot`'s `State.match` also reads `testFailing` to accept snapshot mismatches. Don't add another inversion on top.

**`beforeEach`/`afterEach` don't run for `test.concurrent`.** `getEachHooksForTest` returns empty arrays when `test.concurrent === true`. `beforeAll`/`afterAll` of the enclosing describe still run. Concurrent tests are batched with `pLimit(state.maxConcurrency)` (default 5).

**Retry symbols are read at describe-block start.** `jest.retryTimes(n)` writes `globalThis[RETRY_TIMES]`; `RETRY_IMMEDIATELY` and `WAIT_BEFORE_RETRY` refine timing. Changing them mid-suite only affects not-yet-started describe blocks.

**Uncaught exceptions are captured, not fatal.** `injectGlobalErrorHandlers` (called at `test_started`) replaces the process `uncaughtException`/`unhandledRejection` listeners with ones that call `dispatchSync({name: 'error', ...})`. `restoreGlobalErrorHandlers` puts the originals back after the test. This converts host-process crashes into per-test failures.

## Tests

`e2e/__tests__/circus-*.test.ts` for integration behaviour. `src/__tests__/` for utilities. The legacy runner (`jest-jasmine2`) is a sibling package — kept for compatibility but not the default.
