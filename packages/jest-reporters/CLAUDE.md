# `jest-reporters` — agent notes

## The `Reporter` interface

All methods are optional — implement only what you need:

```ts
interface Reporter {
  onRunStart?(results, options): Promise<void> | void;
  onTestFileStart?(test): Promise<void> | void; // alias: onTestStart
  onTestCaseStart?(test, info): Promise<void> | void;
  onTestCaseResult?(test, result): Promise<void> | void;
  onTestFileResult?(test, result, aggregated): Promise<void> | void; // alias: onTestResult
  onRunComplete?(contexts, results): Promise<void> | void;
  getLastError?(): Error | void;
}
```

`onTestFileResult`/`onTestResult` are aliases; `onTestFileStart`/`onTestStart` are aliases. Call order within a file: `onTestFileStart` → per-test `onTestCaseStart`/`onTestCaseResult` → `onTestFileResult`.

**`getLastError()`**: store an error here (via `this._setError(err)` from `BaseReporter`) to signal a non-fatal failure that should make the run exit non-zero. Checked after `onRunComplete`.

## Configuring reporters

```js
module.exports = {
  reporters: [
    'default', // DefaultReporter
    ['jest-junit', {outputDirectory: './reports'}],
    ['<rootDir>/my-reporter.js', {}],
  ],
};
```

Constructor receives `(globalConfig, reporterOptions, reporterContext)`. `SummaryReporter` is always appended by jest-core. Without `'default'` in the list, `DefaultReporter` is not added.

## Built-in reporters worth knowing

**`DefaultReporter`**: buffers per-file output and flushes atomically on `onTestFileResult`, preventing interleaving from parallel workers. It wraps `process.stdout`/`stderr`.

**`AgentReporter`**: extends `DefaultReporter` but suppresses all buffering, status rendering, and `onTestStart`. Only prints failing tests and the final summary. Auto-activated when `process.env.AI_AGENT` is set or `std-env` detects a CI/agent context.

**`CoverageReporter`**: runs after all test workers finish. For `coverageProvider: 'babel'`, reads `global.__coverage__` from test results. For `'v8'`, reads V8 coverage data. `generateEmptyCoverage()` synthesises all-zero coverage for files never `require()`d.

## Hard rules

- Write to `stderr`, not `stdout`. `BaseReporter.log()` writes to `stderr`; preserve `stdout` for test output.
- Don't throw from reporter methods — catch and use `_setError()` instead.
- `reporterContext.startRun(globalConfig)` triggers a re-run in watch mode only; don't call it outside watch mode.
