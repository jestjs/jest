# `@jest/source-map` — agent notes

## What's public

- `SourceMapSupport#install(sourceMaps, options?)` — replaces `Error.prepareStackTrace` in the current realm so every `error.stack` is rendered against the original sources. `jest-runner` holds one instance per worker and installs once per test file. `{suppressWarnings: true}` turns off the broken-map warning.
- `SourceMapSupport#getCallsite(level, sourceMaps?)` — one remapped `CallSite`, used by `jest-jasmine2` for `--testLocationInResults`.
- `getCallsite(level, sourceMaps?)` — deprecated free-function alias of the method, kept for compatibility. Self-contained: it carries its own module-level registry cache and dies together with it.

`SourceMapCache` / `mapSourcePosition(cache, position)` are the map loader behind both, and are internal — they are not exported from `src/index.ts`.

## Module layout

`SourceMapCache.ts` (the loader and `mapSourcePosition`), `SourceMapSupport.ts` and `getCallsite.ts` have no Node imports — an `eslint.config.mjs` block bans `node:` and `graceful-fs` imports in them. Everything platform-specific — `graceful-fs`, `pathToFileURL`/`fileURLToPath`, `Buffer` — lives behind the `SourceMapFileReader` interface in `types.ts`, implemented once by `nodeFileReader.ts`. A `SourceMapSupport` instance wires the reader in and holds all the formatter state — active cache, per-registry cache reuse, warning bookkeeping — rather than the module.

There is no browser reader today. The seam exists so adding one is a new file rather than a rewrite.

`sourceMaps` is the `SourceMapRegistry` (`Map<generatedPath, sourceMapPath>`) that `jest-runtime` builds while transforming; reach it via `runtime.getSourceMaps()`.

## Why this package exists

Jest ran on `source-map-support` until #16327. Upstream's `0.5.14` changed a frame's function name to come from the **caller's** mapped position, which is the spec-correct reading and makes Jest's output worse, so the dependency sat pinned at `0.5.13` for years while going unmaintained. `@cspotcode/source-map-support` forked after that change and carries it too.

Node's own support is not an alternative: `--enable-source-maps` and `module.setSourceMapsSupport()` do not cover code compiled through `vm` (verified on Node 26 for `runInContext`, `runInThisContext` and `new vm.Script()`, with and without a `//# sourceURL` comment), and there is no public API to register a map for a filename — which is exactly what serving maps out of the registry needs.

`SourceMapSupport.ts` is therefore a trimmed port of `source-map-support@0.5.13` onto `@jridgewell/trace-mapping`. Dropped along the way: XHR-based file retrieval, `hookRequire`, the uncaught-exception shim, the retrieve-handler stacks, and the `headerLength = 62` line-1 column fudge (fixed upstream for Node ≥ 10.16).

## Non-obvious details

**The naming policy is deliberately not spec-correct.** A frame's name is `mappedName(the frame's own position) || v8FunctionName()`. The map's `name` at a call-site position is the identifier being _called_ there, not the enclosing function, so each frame ends up annotated with the call on its line — `at Object.toBeTruthy (assertionCount.test.js:12:17)`, `at Object.setTimeout (inside.js:9:3)`. That reads better in a test failure than the enclosing function's name, which is usually `Object.<anonymous>`. `SourceMapSupport.test.ts` pins these shapes; treat a change there as a product decision, not a bug fix.

**`callSiteToString` decides the exact text of every non-native frame.** It is V8's own `CallSite#toString` copied by way of `source-map-support`, and every frame with a filename goes through it — including the arithmetic that suppresses `[as method]` when `functionName === methodName` (both sides evaluate to `-1`). Rewriting it in "cleaner" JavaScript is how you silently change hundreds of e2e snapshots.

**The error header keeps its trailing separator.** `Error: ` with an empty message, not `Error`. `failureDetailsProperty` snapshots that.

**Install happens in the host realm only.** A `prepareStackTrace` installed outside a `vm` context still runs for errors created inside it, so `jest-runner` no longer loads this package into the sandbox. A sandbox install also breaks: the webpack build requires dependencies lazily on first use, and the first stack is often formatted after the test finished, when `jest-runtime` refuses to load new modules.

**Sources resolve with URL semantics, upstream.** `AnyMap(content, mapUrl)` gets the generated file as a `file:` URL and `trace-mapping` resolves `sources`, `sourceRoot` and every `sections` entry itself — there is no hand-rolled path resolution here to keep in sync with it. `mapSourcePosition` converts the result back with `fileURLToPath`, and leaves other schemes (`webpack:///…`) alone. Two consequences fall out of the URL grammar and are accepted rather than worked around: a source named `weird#name.ts` loses everything from the `#`, and one named `50%off.ts` cannot convert back, so the frame shows the href. Node's `--enable-source-maps` and browsers behave the same way.

**A registered map is parsed against the generated file, not against itself.** Jest writes maps into its transform cache, while the `sources` inside are relative to the file that was transformed — so `mapUrl` is the generated path. The base is baked into the parsed map's resolved sources, which is why the process-lifetime parse cache is keyed on the map path plus the base: a transformer with its own `getCacheKey` can hand two generated files the same map path.

**Unmapped positions are returned unchanged.** A precise location in the compiled file beats a vague one in the original, so `mapSourcePosition` falls back to its input whenever `originalPositionFor` finds nothing. Out-of-range positions (line < 1, column < 0) get the same treatment without asking the tracer, which throws on them — and a throw inside `prepareStackTrace` replaces the whole stack with the exception.

**An unparsable map warns once, from `SourceMapSupport`.** Silence reads as "source maps do not work"; naming the file once per map says why. The cache reports through a callback; the support instance dedupes, honours `suppressWarnings`, and emits via `console.warn` — the host realm's console, not the per-test `BufferedConsole`, so nothing is captured into a test's output. `getCallsite`'s path stays quiet: the formatter reports the same map when a stack formats.

**The formatter is never uninstalled.** It stays for the lifetime of the worker and each `install` swaps in that file's cache. Restoring V8's formatter at teardown instead leaves anything thrown afterwards — a stray timer, a floating promise — reporting a position in the transformed file, which is when a readable stack matters most; `requireAfterTeardown` and `requireAfterTeardownJasmine` pin that. This is safe where `source-map-support` was not: its `retrieveSourceMap` closure captured `runtime` and so retained the whole environment (#15233), whereas `SourceMapCache` only ever references path strings and parsed maps.

**Indexed maps need `AnyMap`.** Bundlers emit maps with a top-level `sections` array; `TraceMap` throws on those, and the `catch` around it would silently leave every frame in such a file at its generated position.

**Fixtures with committed compiler output** (`e2e/source-map-not-transformed/lib/boom.js`) encode their columns in an inline map, so they are excluded from ESLint and Prettier. Reformatting them makes the map point at the wrong columns.
