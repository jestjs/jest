# `@jest/source-map` — agent notes

## What's public

- `installSourceMaps(sourceMaps)` / `uninstallSourceMaps()` — replace `Error.prepareStackTrace` in the current realm so every `error.stack` is rendered against the original sources. `jest-runner` calls these around a test file.
- `getCallsite(level, sourceMaps?)` — one remapped `CallSite`, used by `jest-jasmine2` for `--testLocationInResults`.
- `SourceMapCache` / `getSourceMapCache(sourceMaps)` / `mapSourcePosition(cache, position)` — the map loader both of the above share.

`sourceMaps` is the `SourceMapRegistry` (`Map<generatedPath, sourceMapPath>`) that `jest-runtime` builds while transforming; reach it via `runtime.getSourceMaps()`.

## Why this package exists

Jest ran on `source-map-support` until #16326. Upstream's `0.5.14` changed a frame's function name to come from the **caller's** mapped position, which is the spec-correct reading and makes Jest's output worse, so the dependency sat pinned at `0.5.13` for years while going unmaintained. `@cspotcode/source-map-support` forked after that change and carries it too.

Node's own support is not an alternative: `--enable-source-maps` and `module.setSourceMapsSupport()` do not cover code compiled through `vm` (verified on Node 26 for `runInContext`, `runInThisContext` and `new vm.Script()`, with and without a `//# sourceURL` comment), and there is no public API to register a map for a filename — which is exactly what serving maps out of the registry needs.

`installSourceMaps.ts` is therefore a trimmed port of `source-map-support@0.5.13` onto `@jridgewell/trace-mapping`. Dropped along the way: browser support, `hookRequire`, the uncaught-exception shim, the retrieve-handler stacks, and the `headerLength = 62` line-1 column fudge (fixed upstream for Node ≥ 10.16).

## Non-obvious details

**The naming policy is deliberately not spec-correct.** A frame's name is `mappedName(the frame's own position) || v8FunctionName()`. The map's `name` at a call-site position is the identifier being _called_ there, not the enclosing function, so each frame ends up annotated with the call on its line — `at Object.toBeTruthy (assertionCount.test.js:12:17)`, `at Object.setTimeout (inside.js:9:3)`. That reads better in a test failure than the enclosing function's name, which is usually `Object.<anonymous>`. `installSourceMaps.test.ts` pins these shapes; treat a change there as a product decision, not a bug fix.

**`callSiteToString` decides the exact text of every non-native frame.** It is V8's own `CallSite#toString` copied by way of `source-map-support`, and every frame with a filename goes through it — including the arithmetic that suppresses `[as method]` when `functionName === methodName` (both sides evaluate to `-1`). Rewriting it in "cleaner" JavaScript is how you silently change hundreds of e2e snapshots.

**The error header keeps its trailing separator.** `Error: ` with an empty message, not `Error`. `failureDetailsProperty` snapshots that.

**Install happens in the host realm only.** A `prepareStackTrace` installed outside a `vm` context still runs for errors created inside it, so `jest-runner` no longer loads this package into the sandbox. Don't reintroduce the sandbox install: the webpack build requires dependencies lazily on first use, and the first stack is often formatted after the test finished, when `jest-runtime` refuses to load new modules.

**Unmapped positions are returned unchanged.** A precise location in the compiled file beats a vague one in the original, so `mapSourcePosition` falls back to its input whenever `originalPositionFor` finds nothing.

**Uninstall matters.** The formatter closes over the cache, which holds every parsed `TraceMap` for the run; leaving it on `Error.prepareStackTrace` retains them (#15233). `uninstallSourceMaps` restores the previous formatter and clears the cache, and `e2e/source-map-teardown` fails if it stops doing so.

**Fixtures with committed compiler output** (`e2e/source-map-not-transformed/lib/boom.js`) encode their columns in an inline map, so they are excluded from ESLint and Prettier. Reformatting them makes the map point at the wrong columns.
