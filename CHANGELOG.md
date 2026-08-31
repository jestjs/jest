## main

### Features

### Fixes

- `[jest-config]` Don't warn about global-only options in the config that supplies the global config - the root config a project resolves to, or the first entry of `--projects` when no root config is passed ([#16411](https://github.com/jestjs/jest/pull/16411))
- `[jest-config, jest-types]` Stop accepting `reporters`, `coverageReporters`, `workerIdleMemoryLimit`, `cwd` and `runnerOptions` in a project config - they were silently ignored, and now warn like the other global-only options ([#16411](https://github.com/jestjs/jest/pull/16411))
- `[jest-config, jest-validate]` Warn about `maxWorkers` and `coverageThreshold` in a project config instead of dropping them without a word ([#16411](https://github.com/jestjs/jest/pull/16411))
- `[jest-runtime]` Resolve package `imports` specifiers like `#dep` under ESM again ([#16413](https://github.com/jestjs/jest/pull/16413))

### Chore & Maintenance

- `[jest-util]` Name the `testEnvironmentOptions.globalsCleanup` option and link the docs from the `JEST-01` deprecation warning, and document the option's modes ([#16404](https://github.com/jestjs/jest/pull/16404))

## 30.5.0

### Features

- `[@jest/expect-utils, jest-mock]` Add `mockFn.whenCalledWith(...args)` for configuring return values per argument list, with first-class asymmetric-matcher support ([#16053](https://github.com/jestjs/jest/pull/16053))
- `[@jest/expect-utils]` Export `AsymmetricMatcher` and `FunctionParameters` types (previously private to `expect`) ([#16053](https://github.com/jestjs/jest/pull/16053))
- `[jest-circus, jest-core, jest-jasmine2, jest-test-result, jest-types]` `--collectTests` now expands `test.each`/`describe.each` cases and reports per-status counts (skipped/todo via the new `wouldRun` flag for selected tests) plus a summary line that match a real run, including under `--testNamePattern` and `.only`/`fdescribe` focus on both the circus and jasmine2 runners ([#16259](https://github.com/jestjs/jest/pull/16259))
- `[jest-circus, jest-environment, jest-runtime, jest-types]` Add describe-level retries via `jest.retryTimes(..., {entireDescribe: true})` ([#16322](https://github.com/jestjs/jest/pull/16322))
- `[jest-circus, jest-message-util, jest-reporters, jest-types]` Add `retryMessages` to `AssertionResult` and export `formatErrorStack`, so the retry log renders nested `cause` and `AggregateError` sections with code frames instead of serialized `[cause]:`/`[errors]:` markers ([#16316](https://github.com/jestjs/jest/pull/16316))
- `[jest-circus, jest-types]` Add `unhandledErrorsDetailed` to `Circus.RunResult`, so an unhandled rejection reports its `cause` chain and `AggregateError` entries with code frames instead of a pre-serialized stack ([#16316](https://github.com/jestjs/jest/pull/16316))
- `[jest-haste-map]` Replace `NodeWatcher` and `FSEventsWatcher` with `@parcel/watcher` for the non-watchman watch path ([#16188](https://github.com/jestjs/jest/pull/16188))
- `[jest-resolve]` Bump `unrs-resolver` to 1.12.1, remove `jest-pnp-resolver` and unnecessary checks ([#15721](https://github.com/jestjs/jest/pull/15721))
- `[jest-resolve]` Honor Node's `--preserve-symlinks` / `NODE_PRESERVE_SYMLINKS` in the default resolver by passing `symlinks: false` to `unrs-resolver` ([#16260](https://github.com/jestjs/jest/pull/16260))
- `[jest-runtime]` Apply automocking and manual `__mocks__` files to synchronously evaluable ESM graphs on Node 24.9+ - static imports, dynamic `import()` and `require()` of an ESM file now generate an automock from the real module's namespace instead of failing with "Attempting to import a mock without a factory". Graphs that need async evaluation (top-level await) or an async-only resolver or transformer still throw ([#16391](https://github.com/jestjs/jest/pull/16391))
- `[jest-runtime]` Route `process.getBuiltinModule` through the sandbox, so it returns the sandbox `process` and the hooked `node:module` instead of the host's ([#16391](https://github.com/jestjs/jest/pull/16391))
- `[jest-runtime]` Throw an actionable error from `module.register()` and `module.registerHooks()` inside a test - the hooks attached to the loader running Jest itself, never saw the sandboxed requires they were meant for, and stayed registered for every later test file in the worker ([#16391](https://github.com/jestjs/jest/pull/16391))
- `[jest-runtime]` Surface resolution and import-attribute errors in an ESM graph before executing any of its CJS dependencies on Node 24.9+, matching Node's run-nothing-on-a-broken-graph behavior; the legacy loader on older versions keeps its linking-time execution order ([#16391](https://github.com/jestjs/jest/pull/16391))
- `[jest-runtime]` Throw `ERR_SOURCE_PHASE_NOT_DEFINED` with an actionable message for `import source` and `import.source()`, instead of failing at instantiation with V8's bare "Source phase import object is not defined" ([#16391](https://github.com/jestjs/jest/pull/16391))
- `[jest-runtime]` Emit the JSON-without-import-attribute deprecation warning once per test file instead of once per worker, so it is no longer silently swallowed for every file after the first ([#16391](https://github.com/jestjs/jest/pull/16391))
- `[jest-runtime]` Set `import.meta.main` to `true` in the test file and `false` in every module it loads, matching Node 24+ ([#16367](https://github.com/jestjs/jest/pull/16367))
- `[jest-runtime]` Resolve the `module-sync` export condition, so a package that exposes its ESM entry point for `require()` loads the same file Node would ([#16336](https://github.com/jestjs/jest/pull/16336))
- `[jest-snapshot]` Add external snapshot paths to custom reporter failure details ([#16374](https://github.com/jestjs/jest/pull/16374))

### Fixes

- `[jest-console, jest-reporters]` `CustomConsole` now buffers console output so `TestResult.console` is populated for reporters when `verbose` is enabled, while `GitHubActionsReporter` avoids replaying buffered output in verbose mode ([#16155](https://github.com/jestjs/jest/pull/16155))
- `[expect, jest-message-util, jest-pattern, jest-regex-util, jest-util]` Revert `node:` protocol imports to restore webpack/browser-bundle compatibility ([#16167](https://github.com/jestjs/jest/pull/16167))
- `[expect]` Widen `toMatchObject` and `objectContaining` parameter type from `Record<string, unknown>` to `object` so class instances are accepted ([#16196](https://github.com/jestjs/jest/pull/16196))
- `[jest-circus]` Call a generator test body with the shared test context, so `this` matches what a regular test function receives ([#16347](https://github.com/jestjs/jest/pull/16347))
- `[jest-circus]` Capture the error listeners of the parent process instead of the in-sandbox `process`, so listeners registered before the test file survive teardown and sandbox listeners no longer leak onto the parent ([#16347](https://github.com/jestjs/jest/pull/16347))
- `[jest-circus]` Clear `currentlyRunningTest` after skipped and todo tests ([#16342](https://github.com/jestjs/jest/pull/16342))
- `[jest-circus]` Prevent late `done()` callbacks from affecting later test or hook invocations ([#16343](https://github.com/jestjs/jest/pull/16343))
- `[jest-circus, jest-jasmine2]` Honor `--expand` when formatting `node:assert` failures, instead of always collapsing the diff ([#16347](https://github.com/jestjs/jest/pull/16347))
- `[jest-circus, jest-jasmine2, jest-message-util]` Serialize the inner errors of an `AggregateError` into `failureMessages`, `retryReasons` and `unhandledErrors`, so `--json` output and reporter annotations include them ([#16316](https://github.com/jestjs/jest/pull/16316))
- `[jest-circus, jest-snapshot]` Keep snapshot state and counts correct when a test retries ([#16344](https://github.com/jestjs/jest/pull/16344))
- `[@jest/create-cache-key-function]` Include the caller support flags in the generated key, so a transformer that emits ESM or CJS based on them no longer shares one cache entry between the two ([#16331](https://github.com/jestjs/jest/pull/16331))
- `[@jest/create-cache-key-function]` Include the stringified project config in the generated key, so editing a transformer's own settings invalidates what it cached ([#16331](https://github.com/jestjs/jest/pull/16331))
- `[@jest/transform]` Include the caller support flags in a transform's cache key, so a file transformed both as ESM and as CJS no longer serves one shape's output for the other ([#16331](https://github.com/jestjs/jest/pull/16331))
- `[jest-config]` Add missing `findRelatedTests`, `outputFile`, and `replname` entries to `ValidConfig` so they no longer trigger spurious "Unknown option" warnings ([#16224](https://github.com/jestjs/jest/pull/16224))
- `[jest-config]` Use `--config` for the global config when multiple `--projects` are specified ([#16273](https://github.com/jestjs/jest/pull/16273))
- `[jest-core]` Serialize `bigint` values in `--json` and `--outputFile` output as their literal form (`4n`), instead of failing the run with `TypeError: Do not know how to serialize a BigInt` ([#16338](https://github.com/jestjs/jest/pull/16338))
- `[jest-core]` Do not report a `CustomGC` async resource (used by N-API addons such as napi-rs for per-isolate GC bookkeeping) as an open handle, since it is `napi_unref`'d by the addon and can never keep the event loop alive ([#16379](https://github.com/jestjs/jest/pull/16379))
- `[jest-each]` Keep a `$&`, `` $` ``, `$'` or `$$` inside a `%p` param value out of the replacement, so the title shows the value instead of the text around it ([#16338](https://github.com/jestjs/jest/pull/16338))
- `[jest-each]` Interpolate a `bigint` into a `%j` title as its literal form (`"4n"`) at any depth, instead of throwing `TypeError: Do not know how to serialize a BigInt` while collecting the tests ([#16338](https://github.com/jestjs/jest/pull/16338))
- `[jest-environment, jest-runtime]` Bind `sandboxInjectedGlobals` to the right values when `injectGlobals` is `false`, instead of shifting every one of them by a position ([#16377](https://github.com/jestjs/jest/pull/16377))
- `[jest-environment-node, jest-util]` Only warn about a conflicting `globalsCleanup` mode when one was explicitly configured, and follow the mode that is actually in effect ([#16323](https://github.com/jestjs/jest/pull/16323))
- `[jest-environment-node, jest-util]` Stop resolving lazy globals when setting up an environment, so Node 26's builtin module globals are no longer loaded (and no longer emit their deprecation warnings) for every test file ([#16324](https://github.com/jestjs/jest/pull/16324))
- `[jest-haste-map]` Keep watch mode alive when an outside process briefly makes a file unreadable on Windows, instead of tearing the watcher down on `EPERM` ([#16295](https://github.com/jestjs/jest/pull/16295))
- `[jest-haste-map]` Keep indexing when an outside process holds a file open on Windows, instead of failing the whole crawl on `EPERM` ([#16358](https://github.com/jestjs/jest/pull/16358))
- `[jest-haste-map]` Keep a duplicated manual mock resolving when the file it pointed at is deleted in watch mode ([#16360](https://github.com/jestjs/jest/pull/16360))
- `[jest-haste-map]` Shut the worker farm down when a duplicate manual mock aborts the build under `throwOnModuleCollision` ([#16354](https://github.com/jestjs/jest/pull/16354))
- `[jest-haste-map]` Attach the watchman client's `error` listener before the first command, so a watchman failure falls back to the node crawler instead of crashing on an unhandled `error` event, and always end the client ([#16355](https://github.com/jestjs/jest/pull/16355))
- `[jest-haste-map]` Stop delivering watch events after `WatchmanWatcher` is closed, and route its warnings through the configured console ([#16355](https://github.com/jestjs/jest/pull/16355))
- `[jest-haste-map]` Restore the nested `duplicates` index correctly in `ModuleMap.fromJSON`, so a haste collision reported inside a test worker raises `DuplicateHasteCandidatesError` instead of a `TypeError` ([#16353](https://github.com/jestjs/jest/pull/16353))
- `[jest-haste-map]` Match watched files on a full extension, so `moduleFileExtensions: ['js']` no longer accepts `foo.mjs` ([#16352](https://github.com/jestjs/jest/pull/16352))
- `[jest-haste-map]` Delimit the fields that make up the haste map cache key, so two different option sets cannot hash to the same cache file ([#16352](https://github.com/jestjs/jest/pull/16352))
- `[jest-message-util]` Print the inner errors of an `AggregateError` thrown inside a test ([#16316](https://github.com/jestjs/jest/pull/16316))
- `[jest-message-util]` Indent nested `cause` and `AggregateError` sections of a test failure by one level per depth, so the nesting is legible instead of rendering flat ([#16316](https://github.com/jestjs/jest/pull/16316))
- `[jest-message-util]` Color stack traces line by line so blank lines stay blank ([#16316](https://github.com/jestjs/jest/pull/16316))
- `[jest-message-util]` Detect Jest's own frames without assuming the checkout directory's name, and cover `@jest/*` packages, so stack traces and code frames point at user code ([#16326](https://github.com/jestjs/jest/pull/16326))
- `[jest-mock]` `mockResolvedValue` / `mockRejectedValue` now see all overload return types, so a Promise-returning overload survives even when a later overload returns a non-Promise (e.g. `pg.Client['end']`) ([#16237](https://github.com/jestjs/jest/pull/16237))
- `[@jest-environment/jsdom-abstract]` Make `@types/jsdom` a peer dependency ([#16166](https://github.com/jestjs/jest/pull/16166))
- `[jest-mock]` Remove the leftover own accessor descriptor when restoring a `spyOn` of an inherited getter or setter, so the instance keeps reflecting the prototype ([#16226](https://github.com/jestjs/jest/pull/16226))
- `[jest-resolve]` Include `extensionsToTreatAsEsm` in the `shouldLoadAsEsm` cache key, so projects with different extension lists don't read each other's answers ([#16369](https://github.com/jestjs/jest/pull/16369))
- `[jest-resolve]` Make `getModuleIDAsync` build and cache `data:` URI module IDs the same way as `getModuleID` ([#16370](https://github.com/jestjs/jest/pull/16370))
- `[jest-resolve]` Keep the `node:` prefix when resolving a core module asynchronously, so a builtin that only exists prefixed (`node:sea`, `node:sqlite`, `node:test`, `node:test/reporters`) resolves instead of failing as a missing bare package ([#16388](https://github.com/jestjs/jest/pull/16388))
- `[jest-resolve]` Look up manual mocks for `node:` protocol specifiers under the unprefixed name they are stored as ([#16388](https://github.com/jestjs/jest/pull/16388))
- `[jest-resolve]` Apply `moduleNameMapper` consistently to both spellings of core module specifiers (`fs` vs `node:fs`) ([#16390](https://github.com/jestjs/jest/pull/16390))
- `[jest-resolve]` Keep virtual and ordinary mock module IDs isolated across test files ([#16296](https://github.com/jestjs/jest/pull/16296))
- `[jest-resolve]` Guard missing `require.resolve.paths` ([#16052](https://github.com/jestjs/jest/pull/16052))
- `[jest-resolve, jest-config, jest-runner]` Support a user resolver written as an ES module ([#16332](https://github.com/jestjs/jest/pull/16332))
- `[jest-resolve, jest-runtime]` Throw the CJS parse error for ESM syntax in a `"type": "commonjs"` package or a `.cjs` file instead of loading it as ESM, matching Node ([#16368](https://github.com/jestjs/jest/pull/16368))
- `[@jest/source-map]` Keep source map sources that name a scheme, such as `webpack:///`, instead of resolving them into a path that does not exist ([#16327](https://github.com/jestjs/jest/pull/16327))
- `[@jest/source-map]` Look up `--testLocationInResults` positions at the right column, and keep a mapping to the first column instead of discarding it ([#16327](https://github.com/jestjs/jest/pull/16327))
- `[@jest/source-map]` Warn when a source map cannot be parsed, instead of silently leaving its frames untranslated ([#16327](https://github.com/jestjs/jest/pull/16327))
- `[jest-runner, @jest/source-map]` Keep a source-mapped stack for an error thrown after the test environment was torn down ([#16327](https://github.com/jestjs/jest/pull/16327))
- `[jest-runtime, @jest/source-map]` Keep source maps past teardown and past the next test file's `install`, so a stack from a file no earlier stack mentioned still points at the original source ([#16330](https://github.com/jestjs/jest/pull/16330))
- `[jest-runtime]` Report that no coverage was collected when `getAllV8CoverageInfoCopy` is called after `teardown`, instead of returning an empty result ([#16385](https://github.com/jestjs/jest/pull/16385))
- `[jest-runtime]` Cache a CJS module's parsed exports before walking its re-exports, so two modules that re-export each other no longer overflow the stack when imported from ESM ([#16363](https://github.com/jestjs/jest/pull/16363))
- `[jest-runtime]` Keep a re-exported ES module's parse failure from marking the re-exporting CommonJS file as ESM, so `module.exports = require('./dep.mjs')` loads instead of failing with `module is not defined` ([#16363](https://github.com/jestjs/jest/pull/16363))
- `[jest-runtime]` Scope module mocks instantiated inside `jest.isolateModules`/`isolateModulesAsync` to that block, so a mock first imported there no longer outlives it - matching how CommonJS mocks already behave ([#16365](https://github.com/jestjs/jest/pull/16365))
- `[jest-runtime]` Suspend module isolation while generating an automock, so loading the real module to read its shape no longer populates the isolated registry ([#16365](https://github.com/jestjs/jest/pull/16365))
- `[jest-runtime]` Check a cached ES module's status before `require()` returns it, so a module whose evaluation threw rethrows that error and one left linked by a failed sibling is evaluated instead of returning uninitialized bindings ([#16364](https://github.com/jestjs/jest/pull/16364))
- `[jest-runtime]` Report the original `ERR_REQUIRE_ASYNC_MODULE` when a `require()` of a top-level-await graph is retried, instead of a spurious "concurrent `import()`" error ([#16364](https://github.com/jestjs/jest/pull/16364))
- `[jest-runtime]` Throw the evaluation error when another caller's `import()` of the same module failed while we awaited it, instead of resolving with the errored module ([#16364](https://github.com/jestjs/jest/pull/16364))
- `[jest-runtime]` Mark the result of `require()`ing an ES module that has a default export with `__esModule: true` through a live-binding facade, and serve the same object from `require.cache`, matching Node ([#16367](https://github.com/jestjs/jest/pull/16367))
- `[jest-runtime]` Provide a CommonJS module's exports under the `'module.exports'` named export when imported from ESM, matching Node 23+ ([#16367](https://github.com/jestjs/jest/pull/16367))
- `[jest-runtime]` Give the test file itself a non-null `require.main` ([#16367](https://github.com/jestjs/jest/pull/16367))
- `[jest-runtime]` Populate `module.children` with the modules a file loads, matching Node ([#16368](https://github.com/jestjs/jest/pull/16368))
- `[jest-runtime]` Provide `import.meta.resolve` and `import.meta.jest` in `data:` URI modules, accept any-case mediatype parameters, and use Node's error codes for invalid `data:` URIs ([#16368](https://github.com/jestjs/jest/pull/16368))
- `[jest-runtime]` Key ES modules by full URL, so query and fragment suffixes create the same module instances as Node and show up in `import.meta.url` ([#16375](https://github.com/jestjs/jest/pull/16375))
- `[jest-runtime]` Share modules between overlapping graphs when a CommonJS module `require()`s an ES module mid-load, instead of evaluating shared dependencies twice ([#16375](https://github.com/jestjs/jest/pull/16375))
- `[jest-runtime]` Throw `ERR_REQUIRE_CYCLE_MODULE` like Node when a CommonJS module `require()`s an ES module that is still being loaded, instead of evaluating the module a second time ([#16366](https://github.com/jestjs/jest/pull/16366))
- `[jest-runtime]` Key builtin modules in the ESM registry by one canonical specifier ([#16341](https://github.com/jestjs/jest/pull/16341))
- `[jest-runtime]` `import.meta.resolve()` for a builtin uses its `node:` specifier ([#16341](https://github.com/jestjs/jest/pull/16341))
- `[jest-runtime]` Fall back to native ESM when a `.js` file contains ESM syntax but has no `"type":"module"` marker ([#16152](https://github.com/jestjs/jest/pull/16152))
- `[jest-runtime]` Allow `require()` of ESM-marked files on Node < 24.9 via transform fallback ([#16244](https://github.com/jestjs/jest/pull/16244))
- `[jest-runtime, @jest/transform]` Surface actionable `ERR_REQUIRE_ESM` error for files with untransformed ESM syntax instead of the generic "unexpected token" message ([#16244](https://github.com/jestjs/jest/pull/16244))
- `[jest-runtime]` Support older test environments whose `moduleMocker` does not implement `clearMocksOnScope` ([#16169](https://github.com/jestjs/jest/pull/16169))
- `[jest-runtime]` Apply `jest.unstable_mockModule` when the mocked file itself is `require()`d, not only when it is imported as a dependency ([#16389](https://github.com/jestjs/jest/pull/16389))
- `[jest-runtime]` Apply `jest.unstable_mockModule` to statically imported `data:` URIs on Node 24.9+, matching dynamic `import()` ([#16389](https://github.com/jestjs/jest/pull/16389))
- `[jest-runtime]` Run an async `jest.unstable_mockModule` factory once per module instead of twice, and fail the import instead of crashing the worker when the factory rejects ([#16389](https://github.com/jestjs/jest/pull/16389))
- `[jest-runtime]` Hide a `require(esm)` module that failed to evaluate from `require.cache`, as Node does, instead of exposing a namespace with uninitialized bindings ([#16389](https://github.com/jestjs/jest/pull/16389))
- `[jest-runtime]` Strip the byte-order mark when importing a JSON module, matching `require()` and Node ([#16389](https://github.com/jestjs/jest/pull/16389))
- `[jest-runtime]` Throw `ERR_REQUIRE_ASYNC_MODULE` when `require(esm)` runs under an async-only custom resolver, instead of silently resolving with the default resolver ([#16389](https://github.com/jestjs/jest/pull/16389))
- `[jest-runtime]` Parse imported JSON modules with the test realm's `JSON`, so their objects pass `instanceof Object` inside the test like `require()`d JSON does ([#16389](https://github.com/jestjs/jest/pull/16389))
- `[jest-runtime]` Accept every `file:` URL string in the sandboxed `module.createRequire`, including one with a `localhost` authority, as Node does ([#16389](https://github.com/jestjs/jest/pull/16389))
- `[jest-runtime]` Point at `{virtual: true}` when `jest.mock` or `jest.unstable_mockModule` is given a module that cannot be resolved ([#16389](https://github.com/jestjs/jest/pull/16389))
- `[jest-reporters]` Fix coverage report table formatting in CI/GitHub Actions environments where `process.stdout.columns` is undefined by falling back to the `COLUMNS` env var or `80` columns in CI, preserving existing behaviour in other non-TTY environments ([#16227](https://github.com/jestjs/jest/pull/16227))
- `[jest-runtime]` Support CJS-in-ESM exports via `"module.exports"` named exports ([#16277](https://github.com/jestjs/jest/pull/16277))
- `[jest-snapshot]` Keep a skipped or failed test's hinted snapshots, instead of reporting them obsolete ([#16348](https://github.com/jestjs/jest/pull/16348))
- `[jest-util]` Stop `globsToMatcher` reusing a cached matcher compiled with different picomatch options, and keep its `dot: true` default when `dot` is passed as `undefined` ([#16381](https://github.com/jestjs/jest/pull/16381))
- `[pretty-format]` Move the `react-is` aliases into the `@jest` scope, so they cannot be shadowed by unrelated packages published under the alias names ([#16333](https://github.com/jestjs/jest/pull/16333))

### Chore & Maintenance

- `[docs]` Document the intentional divergences from Node's module system in the ECMAScript Modules page ([#16368](https://github.com/jestjs/jest/pull/16368))
- `[docs]` Note deprecation of `react-test-renderer` in React Native tutorial and `pretty-format` README ([#16294](https://github.com/jestjs/jest/pull/16294))
- `[docs]` Use `@testing-library/react-native` in the React Native tutorial instead of the deprecated `react-test-renderer` ([#16318](https://github.com/jestjs/jest/pull/16318))
- `[babel-jest, @jest/transform]` Update `babel-plugin-istanbul` to v8 ([#16049](https://github.com/jestjs/jest/pull/16049))
- `[jest-config, @jest/reporters, jest-runtime]` Update `glob` to v13 ([#16397](https://github.com/jestjs/jest/pull/16397))
- `[jest-haste-map]` Refactor massive class into multiple files ([#16180](https://github.com/jestjs/jest/pull/16180))
- `[jest-haste-map]` Drop `walker` dependency; replace hand-rolled directory recursion in the JS crawler and watcher startup with `fdir` ([#16187](https://github.com/jestjs/jest/pull/16187))
- `[jest-haste-map]` Reuse cached metadata for files whose haste name is a known duplicate, instead of re-reading and re-parsing them on every startup ([#16351](https://github.com/jestjs/jest/pull/16351))
- `[jest-haste-map]` Cache the watchman socket path and replace the `watchman --version` probe with `get-sockname`, so warm runs spawn no watchman processes ([#16386](https://github.com/jestjs/jest/pull/16386))
- `[jest-resolve]` Store the per-directory package-type lookup in the cache it reads, so it actually memoizes ([#16369](https://github.com/jestjs/jest/pull/16369))
- `[jest-resolve, jest-runtime]` Cut repeated work on the resolution hot path: hoist the platform-extension list to construction, memoize `isCoreModule` and the options cache-key serialization, skip mapper preparation when no `moduleNameMapper` is configured, run each mapper regex once, and stop re-parsing `NODE_OPTIONS` on every default-resolver call ([#16371](https://github.com/jestjs/jest/pull/16371))
- `[jest-resolve]` Cut warm resolution cost to about a third: reuse one `unrs-resolver` factory per options shape instead of cloning per resolution, compose the factory cache key from per-array cached strings instead of serializing options, and stop constructing an `Error` for misses that `findNodeModule` swallows; add a `__benchmarks__` suite for the default resolver ([#16373](https://github.com/jestjs/jest/pull/16373))
- `[jest-runner, @jest/source-map]` Replace `source-map-support` with an implementation in `@jest/source-map` ([#16327](https://github.com/jestjs/jest/pull/16327))
- `[jest-snapshot]` Load babel, semver and synckit lazily, so requiring the package (which every test process does through `@jest/expect`) no longer loads ~200 modules that only writing inline snapshots needs ([#16387](https://github.com/jestjs/jest/pull/16387))
- `[jest-runtime]` Reduce per-require overhead: skip module ID resolution when no mock can apply, answer core modules before probing for a manual mock, share one `require.cache` proxy across modules, and cache empty files ([#16376](https://github.com/jestjs/jest/pull/16376))
- `[@jest/source-map]` Deprecate `getCallsite` in favour of `SourceMapSupport#getCallsite` ([#16327](https://github.com/jestjs/jest/pull/16327))
- `[jest-runtime]` Avoid magical `null` value in ESM loader ([#16160](https://github.com/jestjs/jest/pull/16160))

## 30.4.2

### Fixes

- `[jest-runtime]` Fix named imports from CJS modules whose `module.exports` is a function with own-property exports ([#16150](https://github.com/jestjs/jest/pull/16150))

## 30.4.1

### Features

- `[jest-config, jest-core, jest-runner, jest-schemas, jest-types]` Allow custom runner configuration options via tuple format `['runner-path', {options}]` ([#16141](https://github.com/jestjs/jest/pull/16141))

### Fixes

- `[jest-runtime]` Align CJS-from-ESM default export with Node: `module.exports` is always the ESM default, `__esModule` unwrapping is no longer applied ([#16143](https://github.com/jestjs/jest/pull/16143))

## 30.4.0

### Features

- `[babel-jest]` Support collecting coverage from `.mts`, `.cts` (and other) files ([#15994](https://github.com/jestjs/jest/pull/15994))
- `[jest-circus, jest-cli, jest-config, jest-core, jest-jasmine2, jest-types]` Add `--collect-tests` flag to discover and list tests without executing them ([#16006](https://github.com/jestjs/jest/pull/16006))
- `[jest-config, jest-runner, jest-worker]` Add `workerGracefulExitTimeout` config option to control how long workers are given to exit before being force-killed ([#15984](https://github.com/jestjs/jest/pull/15984))
- `[jest-config]` Add support for `jest.config.mts` as a valid configuration file ([#16005](https://github.com/jestjs/jest/pull/16005))
- `[jest-config, jest-core, jest-reporters, jest-runner]` `verbose` and `silent` can now be set per-project; the project-level value overrides the global value for that project's tests ([#16133](https://github.com/jestjs/jest/pull/16133))
- `[@jest/fake-timers]` Accept `Temporal.Duration` in `jest.advanceTimersByTime()` and `jest.advanceTimersByTimeAsync()` ([#16128](https://github.com/jestjs/jest/pull/16128))
- `[@jest/fake-timers]` Accept `Temporal.Instant` and `Temporal.ZonedDateTime` in `jest.setSystemTime()` and `useFakeTimers({now})` ([#16128](https://github.com/jestjs/jest/pull/16128))
- `[@jest/fake-timers]` Support faking `Temporal.Now.*` ([#16131](https://github.com/jestjs/jest/pull/16131))
- `[jest-mock]` Add `clearMocksOnScope(scope)` on `ModuleMocker` for clearing every mock function exposed on a scope object ([#16088](https://github.com/jestjs/jest/pull/16088))
- `[jest-resolve]` Add `canResolveSync()` on `Resolver` so callers can detect when a user-configured resolver only exports an `async` hook ([#16064](https://github.com/jestjs/jest/pull/16064))
- `[jest-runtime]` Use synchronous `evaluate()` for ES modules without top-level `await` on Node versions that support it (v24.9+), and prefer the synchronous transform path when a sync transformer is configured ([#16062](https://github.com/jestjs/jest/pull/16062))
- `[jest-runtime]` Support `require()` of ES modules on Node v24.9+ ([#16074](https://github.com/jestjs/jest/pull/16074))
- `[jest-runtime]` Validate TC39 import attributes (`with { type: 'json' }`) on ESM imports ([#16127](https://github.com/jestjs/jest/pull/16127))
- `[@jest/transform]` Add `canTransformSync(filename)` on `ScriptTransformer` so callers can pick the sync vs async transform path ([#16062](https://github.com/jestjs/jest/pull/16062))
- `[jest-util]` Add `isError` helper ([#16076](https://github.com/jestjs/jest/pull/16076))
- `[pretty-format]` Support React 19 ([#16123](https://github.com/jestjs/jest/pull/16123))

### Fixes

- `[expect-utils]` Fix `toStrictEqual` failing on `structuredClone` results due to cross-realm constructor mismatch ([#15959](https://github.com/jestjs/jest/pull/15959))
- `[@jest/expect-utils]` Prevent `toMatchObject`/subset matching from throwing when encountering exotic iterables ([#15952](https://github.com/jestjs/jest/pull/15952))
- `[fake-timers]` Convert `Date` to milliseconds before passing to `@sinonjs/fake-timers` ([#16029](https://github.com/jestjs/jest/pull/16029))
- `[jest]` Export `GlobalConfig` and `ProjectConfig` TypeScript types ([#16132](https://github.com/jestjs/jest/pull/16132))
- `[jest-circus]` Prevent crash when `asyncError` is undefined for non-Error throws ([#16003](https://github.com/jestjs/jest/pull/16003))
- `[jest-circus, jest-jasmine2]` Include `Error.cause` in JSON `failureMessages` output ([#15967](https://github.com/jestjs/jest/pull/15967))
- `[jest-config]` Fix preset path resolution on Windows when the preset uses subpath `exports` ([#15961](https://github.com/jestjs/jest/pull/15961))
- `[jest-config]` Allow `collectCoverage` and `coverageProvider` in project config without a validation warning ([#16132](https://github.com/jestjs/jest/pull/16132))
- `[jest-config]` Project config validator now emits "is not supported in an individual project configuration" instead of "probably a typing mistake" for known global-only options ([#16132](https://github.com/jestjs/jest/pull/16132))
- `[jest-environment-node]` Fix `--localstorage-file` warning on Node 25+ ([#16086](https://github.com/jestjs/jest/pull/16086))
- `[jest-reporters]` Apply global coverage threshold to unmatched pattern files in addition to glob/path thresholds ([#16137](https://github.com/jestjs/jest/pull/16137))
- `[jest-reporters, jest-runner, jest-runtime, jest-transform]` Fix coverage report not showing correct code coverage when using `projects` config option ([#16140](https://github.com/jestjs/jest/pull/16140))
- `[jest-runtime]` Resolve `expect` and `@jest/expect` from the internal module registry so test-file imports share the same `JestAssertionError` as the global `expect` ([#16130](https://github.com/jestjs/jest/pull/16130))
- `[jest-runtime]` Improve CJS-from-ESM interop: `__esModule`/Babel default unwrap, broader named-export coverage, and shared CJS singleton across importers ([#16050](https://github.com/jestjs/jest/pull/16050))
- `[jest-runtime]` Load `.js` files with ESM syntax but no `"type":"module"` marker as native ESM ([#16050](https://github.com/jestjs/jest/pull/16050))
- `[jest-runtime]` Extend the `.js`-with-ESM-syntax fallback to `require()` on Node v24.9+ - falls back to `require(esm)` when the CJS parser rejects ESM syntax ([#16078](https://github.com/jestjs/jest/pull/16078))
- `[jest-runtime]` Fix deadlocks and double-evaluation in concurrent ESM and wasm imports ([#16050](https://github.com/jestjs/jest/pull/16050))
- `[jest-runtime]` Fix error when `require()` is called after the Jest environment has been torn down ([#15951](https://github.com/jestjs/jest/pull/15951))
- `[jest-runtime]` Fix missing error when `import()` is called after the Jest environment has been torn down ([#16080](https://github.com/jestjs/jest/pull/16080))
- `[jest-runtime]` Fix virtual `unstable_mockModule` registrations not respected in ESM ([#16081](https://github.com/jestjs/jest/pull/16081))
- `[jest-runtime]` Apply `moduleNameMapper` when resolving modules with `require.resolve()` and the `paths` option ([#16135](https://github.com/jestjs/jest/pull/16135))

### Chore & Maintenance

- `[@jest/fake-timers]` Upgrade `@sinonjs/fake-timers` ([#16139](https://github.com/jestjs/jest/pull/16139))
- `[jest-runtime]` Use synchronous `linkRequests` / `instantiate` for ESM linking on Node v24.9+ ([#16063](https://github.com/jestjs/jest/pull/16063))

## 30.3.0

### Features

- `[jest-config]` Add `defineConfig` and `mergeConfig` helpers for type-safe Jest config ([#15844](https://github.com/jestjs/jest/pull/15844))
- `[jest-fake-timers]` Add `setTimerTickMode` to configure how timers advance
- `[*]` Reduce token usage when run through LLMs ([`3f17932`](https://github.com/jestjs/jest/commit/3f17932061c0203999451e5852664093de876709))

### Fixes

- `[jest-config]` Keep CLI coverage output when using `--json` with `--outputFile` ([#15918](https://github.com/jestjs/jest/pull/15918))
- `[jest-mock]` Use `Symbol` from test environment ([#15858](https://github.com/jestjs/jest/pull/15858))
- `[jest-reporters]` Fix issue where console output not displayed for GHA reporter even with `silent: false` option ([#15864](https://github.com/jestjs/jest/pull/15864))
- `[jest-runtime]` Fix issue where user cannot utilize dynamic import despite specifying `--experimental-vm-modules` Node option ([#15842](https://github.com/jestjs/jest/pull/15842))
- `[jest-test-sequencer]` Fix issue where failed tests due to compilation errors not getting re-executed even with `--onlyFailures` CLI option ([#15851](https://github.com/jestjs/jest/pull/15851))
- `[jest-util]` Make sure `process.features.require_module` is `false` ([#15867](https://github.com/jestjs/jest/pull/15867))

### Chore & Maintenance

- `[*]` Replace remaining micromatch uses with picomatch
- `[deps]` Update to sinon/fake-timers v15
- `[docs]` Update V30 migration guide to notify users on `jest.mock()` work with case-sensitive path ([#15849](https://github.com/jestjs/jest/pull/15849))
- Updated Twitter icon to match the latest brand guidelines ([#15869](https://github.com/jestjs/jest/pull/15869))

## 30.2.0

### Chore & Maintenance

- `[*]` Update example repo for testing React Native projects ([#15832](https://github.com/jestjs/jest/pull/15832))
- `[*]` Update `jest-watch-typeahead` to v3 ([#15830](https://github.com/jestjs/jest/pull/15830))

## Features

- `[jest-environment-jsdom-abstract]` Add support for JSDOM v27 ([#15834](https://github.com/jestjs/jest/pull/15834))

### Fixes

- `[jest-matcher-utils]` Fix infinite recursion with self-referential getters in `deepCyclicCopyReplaceable` ([#15831](https://github.com/jestjs/jest/pull/15831))
- `[babel-jest]` Export the `TransformerConfig` interface ([#15820](https://github.com/jestjs/jest/pull/15820))
- `[jest-config]` Fix `jest.config.ts` with TS loader specified in docblock pragma ([#15839](https://github.com/jestjs/jest/pull/15839))

## 30.1.3

### Fixes

- Fix `unstable_mockModule` with `node:` prefixed core modules.

## 30.1.2

### Fixes

- `[jest-snapshot-utils]` Correct snapshot header regexp to work with newline across OSes ([#15803](https://github.com/jestjs/jest/pull/15803))

## 30.1.1

### Fixes

- `[jest-snapshot-utils]` Fix deprecated goo.gl snapshot warning not handling Windows end-of-line sequences ([#15800](https://github.com/jestjs/jest/pull/15800))
- `[jest-snapshot-utils]` Improve messaging about goo.gl snapshot link change ([#15821](https://github.com/jestjs/jest/pull/15821))

## 30.1.0

## Features

- `[jest-leak-detector]` Configurable GC aggressiveness regarding to V8 heap snapshot generation ([#15793](https://github.com/jestjs/jest/pull/15793/))
- `[jest-runtime]` Reduce redundant ReferenceError messages
- `[jest-core]` Include test modules that failed to load when --onlyFailures is active

### Fixes

- `[jest-snapshot-utils]` Fix deprecated goo.gl snapshot guide link not getting replaced with fully canonical URL ([#15787](https://github.com/jestjs/jest/pull/15787))
- `[jest-circus]` Fix `it.concurrent` not working with `describe.skip` ([#15765](https://github.com/jestjs/jest/pull/15765))
- `[jest-snapshot]` Fix mangled inline snapshot updates when used with Prettier 3 and CRLF line endings
- `[jest-runtime]` Importing from `@jest/globals` in more than one file no longer breaks relative paths ([#15773](https://github.com/jestjs/jest/pull/15773))

# Chore

- `[expect]` Update docblock for `toContain()` to display info on substring check ([#15789](https://github.com/jestjs/jest/pull/15789))

## 30.0.5

### Features

- `[jest-config]` Allow `testMatch` to take a string value
- `[jest-worker]` Let `workerIdleMemoryLimit` accept 0 to always restart worker child processes

### Fixes

- `[expect]` Fix `bigint` error ([#15702](https://github.com/jestjs/jest/pull/15702))

## 30.0.4

### Features

- `[expect]` The `Inverse` type is now exported ([#15714](https://github.com/jestjs/jest/pull/15714))
- `[expect]` feat: support `async functions` in `toBe` ([#15704](https://github.com/jestjs/jest/pull/15704))

### Fixes

- `[jest]` jest --onlyFailures --listTests now correctly lists only failed tests (#15700)
- `[jest-snapshot]` Handle line endings in snapshots ([#15708](https://github.com/jestjs/jest/pull/15708))

## 30.0.3

### Fixes

- `[jest-config]` Fix ESM TS config loading in a CJS project ([#15694](https://github.com/jestjs/jest/pull/15694))
- `[jest-core]` jest --onlyFailures --listTests now correctly lists only failed tests([#15700](https://github.com/jestjs/jest/pull/15700))

### Features

- `[jest-diff]` Show non-printable control characters to diffs ([#15696](https://github.com/jestjs/jest/pull/15696))

## 30.0.2

### Fixes

- `[jest-matcher-utils]` Make 'deepCyclicCopyObject' safer by setting descriptors to a null-prototype object ([#15689](https://github.com/jestjs/jest/pull/15689))
- `[jest-util]` Make garbage collection protection property writable ([#15689](https://github.com/jestjs/jest/pull/15689))

## 30.0.1

### Features

- `[jest-resolver]` Implement the `defaultAsyncResolver` ([#15679](https://github.com/jestjs/jest/pull/15679))

### Fixes

- `[jest-resolver]` Resolve builtin modules correctly ([#15683](https://github.com/jestjs/jest/pull/15683))
- `[jest-environment-node, jest-util]` Avoid setting globals cleanup protection symbol when feature is off ([#15684](https://github.com/jestjs/jest/pull/15684))

### Chore & Maintenance

- `[*]` Remove and deprecate `jest-repl` package ([#15673](https://github.com/jestjs/jest/pull/15673))
- `[jest-resolver]` Replace custom `isBuiltinModule` with node's `isBuiltin` ([#15685](https://github.com/jestjs/jest/pull/15685))

## 30.0.0

### Features

- `[*]` Renamed `globalsCleanupMode` to `globalsCleanup` and `--waitNextEventLoopTurnForUnhandledRejectionEvents` to `--waitForUnhandledRejections`
- `[expect]` Add `ArrayOf` asymmetric matcher for validating array elements. ([#15567](https://github.com/jestjs/jest/pull/15567))
- `[babel-jest]` Add option `excludeJestPreset` to allow opting out of `babel-preset-jest` ([#15164](https://github.com/jestjs/jest/pull/15164))
- `[expect]` Revert [#15038](https://github.com/jestjs/jest/pull/15038) to fix `expect(fn).toHaveBeenCalledWith(expect.objectContaining(...))` when there are multiple calls ([#15508](https://github.com/jestjs/jest/pull/15508))
- `[jest-circus, jest-cli, jest-config]` Add `waitNextEventLoopTurnForUnhandledRejectionEvents` flag to minimise performance impact of correct detection of unhandled promise rejections introduced in [#14315](https://github.com/jestjs/jest/pull/14315) ([#14681](https://github.com/jestjs/jest/pull/14681))
- `[jest-circus]` Add a `waitBeforeRetry` option to `jest.retryTimes` ([#14738](https://github.com/jestjs/jest/pull/14738))
- `[jest-circus]` Add a `retryImmediately` option to `jest.retryTimes` ([#14696](https://github.com/jestjs/jest/pull/14696))
- `[jest-circus, jest-jasmine2]` Allow `setupFilesAfterEnv` to export an async function ([#14749](https://github.com/jestjs/jest/pull/14749))
- `[jest-circus, jest-test-result]` Add `startedAt` timestamp in `TestCaseResultObject` within `onTestCaseResult` ([#15145](https://github.com/jestjs/jest/pull/15145))
- `[jest-cli]` Export `buildArgv` ([#15310](https://github.com/jestjs/jest/pull/15310))
- `[jest-config]` [**BREAKING**] Add `mts` and `cts` to default `moduleFileExtensions` config ([#14369](https://github.com/jestjs/jest/pull/14369))
- `[jest-config]` [**BREAKING**] Update `testMatch` and `testRegex` default option for supporting `mjs`, `cjs`, `mts`, and `cts` ([#14584](https://github.com/jestjs/jest/pull/14584))
- `[jest-config]` Loads config file from provided path in `package.json` ([#14044](https://github.com/jestjs/jest/pull/14044))
- `[jest-config]` Allow loading `jest.config.cts` files ([#14070](https://github.com/jestjs/jest/pull/14070))
- `[jest-config]` Show `rootDir` in error message when a `preset` fails to load ([#15194](https://github.com/jestjs/jest/pull/15194))
- `[jest-config]` Support loading TS config files using `esbuild-register` via docblock loader ([#15190](https://github.com/jestjs/jest/pull/15190))
- `[jest-config]` Allow passing TS config loader options via docblock comment ([#15234](https://github.com/jestjs/jest/pull/15234))
- `[jest-config]` If Node is running with type stripping enabled, do not require a TS loader ([#15480](https://github.com/jestjs/jest/pull/15480))
- `[@jest/core]` Group together open handles with the same stack trace ([#13417](https://github.com/jestjs/jest/pull/13417), & [#14789](https://github.com/jestjs/jest/pull/14789))
- `[@jest/core]` Add `perfStats` to surface test setup overhead ([#14622](https://github.com/jestjs/jest/pull/14622))
- `[@jest/core]` [**BREAKING**] Changed `--filter` to accept an object with shape `{ filtered: Array<string> }` to match [documentation](https://jestjs.io/docs/cli#--filterfile) ([#13319](https://github.com/jestjs/jest/pull/13319))
- `[@jest/core]` Support `--outputFile` option for [`--listTests`](https://jestjs.io/docs/cli#--listtests) ([#14980](https://github.com/jestjs/jest/pull/14980))
- `[@jest/core]` Stringify Errors properly with `--json` flag ([#15329](https://github.com/jestjs/jest/pull/15329))
- `[@jest/core, @jest/test-sequencer]` [**BREAKING**] Exposes `globalConfig` & `contexts` to `TestSequencer` ([#14535](https://github.com/jestjs/jest/pull/14535), & [#14543](https://github.com/jestjs/jest/pull/14543))
- `[jest-each]` Introduce `%$` option to add number of the test to its title ([#14710](https://github.com/jestjs/jest/pull/14710))
- `[@jest/environment]` [**BREAKING**] Remove deprecated `jest.genMockFromModule()` ([#15042](https://github.com/jestjs/jest/pull/15042))
- `[@jest/environment]` [**BREAKING**] Remove unnecessary defensive code ([#15045](https://github.com/jestjs/jest/pull/15045))
- `[jest-environment-jsdom]` [**BREAKING**] Upgrade JSDOM to v22 ([#13825](https://github.com/jestjs/jest/pull/13825))
- `[@jest/environment-jsdom-abstract]` Introduce new package which abstracts over the `jsdom` environment, allowing usage of custom versions of JSDOM ([#14717](https://github.com/jestjs/jest/pull/14717))
- `[jest-environment-node]` Update jest environment with dispose symbols `Symbol` ([#14888](https://github.com/jestjs/jest/pull/14888) & [#14909](https://github.com/jestjs/jest/pull/14909))
- `[expect, @jest/expect]` [**BREAKING**] Add type inference for function parameters in `CalledWith` assertions ([#15129](https://github.com/jestjs/jest/pull/15129))
- `[@jest/expect-utils]` Properly compare all types of `TypedArray`s ([#15178](https://github.com/jestjs/jest/pull/15178))
- `[@jest/fake-timers]` [**BREAKING**] Upgrade `@sinonjs/fake-timers` to v13 ([#14544](https://github.com/jestjs/jest/pull/14544) & [#15470](https://github.com/jestjs/jest/pull/15470))
- `[@jest/fake-timers]` Exposing new modern timers function `advanceTimersToFrame()` which advances all timers by the needed milliseconds to execute callbacks currently scheduled with `requestAnimationFrame` ([#14598](https://github.com/jestjs/jest/pull/14598))
- `[jest-matcher-utils]` Add `SERIALIZABLE_PROPERTIES` to allow custom serialization of objects ([#14893](https://github.com/jestjs/jest/pull/14893))
- `[jest-mock]` Add support for the Explicit Resource Management proposal to use the `using` keyword with `jest.spyOn(object, methodName)` ([#14895](https://github.com/jestjs/jest/pull/14895))
- `[jest-reporters]` Add support for [DEC mode 2026](https://gist.github.com/christianparpart/d8a62cc1ab659194337d73e399004036) ([#15008](https://github.com/jestjs/jest/pull/15008))
- `[jest-resolver]` Support `file://` URLs as paths ([#15154](https://github.com/jestjs/jest/pull/15154))
- `[jest-resolve,jest-runtime,jest-resolve-dependencies]` Pass the conditions when resolving stub modules ([#15489](https://github.com/jestjs/jest/pull/15489))
- `[jest-runtime]` Exposing new modern timers function `jest.advanceTimersToFrame()` from `@jest/fake-timers` ([#14598](https://github.com/jestjs/jest/pull/14598))
- `[jest-runtime]` Support `import.meta.filename` and `import.meta.dirname` (available from [Node 20.11](https://nodejs.org/en/blog/release/v20.11.0)) ([#14854](https://github.com/jestjs/jest/pull/14854))
- `[jest-runtime]` Support `import.meta.resolve` ([#14930](https://github.com/jestjs/jest/pull/14930))
- `[jest-runtime]` [**BREAKING**] Make it mandatory to pass `globalConfig` to the `Runtime` constructor ([#15044](https://github.com/jestjs/jest/pull/15044))
- `[jest-runtime]` Add `unstable_unmockModule` ([#15080](https://github.com/jestjs/jest/pull/15080))
- `[jest-runtime]` Add `onGenerateMock` transformer callback for auto generated callbacks ([#15433](https://github.com/jestjs/jest/pull/15433) & [#15482](https://github.com/jestjs/jest/pull/15482))
- `[jest-runtime]` [**BREAKING**] Use `vm.compileFunction` over `vm.Script` ([#15461](https://github.com/jestjs/jest/pull/15461))
- `[@jest/schemas]` Upgrade `@sinclair/typebox` to v0.34 ([#15450](https://github.com/jestjs/jest/pull/15450))
- `[@jest/types]` `test.each()`: Accept a readonly (`as const`) table properly ([#14565](https://github.com/jestjs/jest/pull/14565))
- `[@jest/types]` Improve argument type inference passed to `test` and `describe` callback functions from `each` tables ([#14920](https://github.com/jestjs/jest/pull/14920))
- `[jest-snapshot]` [**BREAKING**] Add support for [Error causes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause) in snapshots ([#13965](https://github.com/jestjs/jest/pull/13965))
- `[jest-snapshot]` Support Prettier 3 ([#14566](https://github.com/jestjs/jest/pull/14566))
- `[@jest/util-snapshot]` Extract utils used by tooling from `jest-snapshot` into its own package ([#15095](https://github.com/jestjs/jest/pull/15095))
- `[pretty-format]` [**BREAKING**] Do not render empty string children (`''`) in React plugin ([#14470](https://github.com/jestjs/jest/pull/14470))

### Fixes

- `[expect]` Show `AggregateError` to display ([#15346](https://github.com/jestjs/jest/pull/15346))
- `[*]` Replace `exit` with `exit-x` ([#15399](https://github.com/jestjs/jest/pull/15399))
- `[babel-plugin-jest-hoist]` Use `denylist` instead of the deprecated `blacklist` for Babel 8 support ([#14109](https://github.com/jestjs/jest/pull/14109))
- `[babel-plugin-jest-hoist]` Do not rely on buggy Babel behaviour ([#15415](https://github.com/jestjs/jest/pull/15415))
- `[expect]` Check error instance type for `toThrow/toThrowError` ([#14576](https://github.com/jestjs/jest/pull/14576))
- `[expect]` Improve diff for failing `expect.objectContaining` ([#15038](https://github.com/jestjs/jest/pull/15038))
- `[expect]` Use `Array.isArray` to check if an array is an `Array` ([#15101](https://github.com/jestjs/jest/pull/15101))
- `[expect]` Fix Error `cause` assertion errors ([#15339](https://github.com/jestjs/jest/pull/15339))
- `[jest-changed-files]` Print underlying errors when VCS commands fail ([#15052](https://github.com/jestjs/jest/pull/15052))
- `[jest-changed-files]` Abort `sl root` call if output resembles a steam locomotive ([#15053](https://github.com/jestjs/jest/pull/15053))
- `[jest-circus]` [**BREAKING**] Prevent false test failures caused by promise rejections handled asynchronously ([#14315](https://github.com/jestjs/jest/pull/14315))
- `[jest-circus]` Replace recursive `makeTestResults` implementation with iterative one ([#14760](https://github.com/jestjs/jest/pull/14760))
- `[jest-circus]` Omit `expect.hasAssertions()` errors if a test already has errors ([#14866](https://github.com/jestjs/jest/pull/14866))
- `[jest-circus, jest-expect, jest-snapshot]` Pass `test.failing` tests when containing failing snapshot matchers ([#14313](https://github.com/jestjs/jest/pull/14313))
- `[jest-circus]` Concurrent tests now emit jest circus events at the correct point and in the expected order. ([#15381](https://github.com/jestjs/jest/pull/15381))
- `[jest-cli]` [**BREAKING**] Validate CLI flags that require arguments receives them ([#14783](https://github.com/jestjs/jest/pull/14783))
- `[jest-config]` Make sure to respect `runInBand` option ([#14578](https://github.com/jestjs/jest/pull/14578))
- `[jest-config]` Support `testTimeout` in project config ([#14697](https://github.com/jestjs/jest/pull/14697))
- `[jest-config]` Support `coverageReporters` in project config ([#14830](https://github.com/jestjs/jest/pull/14830))
- `[jest-config]` Allow `reporters` in project config ([#14768](https://github.com/jestjs/jest/pull/14768))
- `[jest-config]` Allow Node16/NodeNext/Bundler `moduleResolution` in project's tsconfig ([#14739](https://github.com/jestjs/jest/pull/14739))
- `[@jest/create-cache-key-function]` Correct the return type of `createCacheKey` ([#15159](https://github.com/jestjs/jest/pull/15159))
- `[jest-each]` Allow `$keypath` templates with `null` or `undefined` values ([#14831](https://github.com/jestjs/jest/pull/14831))
- `[@jest/expect-utils]` Fix comparison of `DataView` ([#14408](https://github.com/jestjs/jest/pull/14408))
- `[@jest/expect-utils]` [**BREAKING**] exclude non-enumerable in object matching ([#14670](https://github.com/jestjs/jest/pull/14670))
- `[@jest/expect-utils]` Fix comparison of `URL` ([#14672](https://github.com/jestjs/jest/pull/14672))
- `[@jest/expect-utils]` Check `Symbol` properties in equality ([#14688](https://github.com/jestjs/jest/pull/14688))
- `[@jest/expect-utils]` Catch circular references within arrays when matching objects ([#14894](https://github.com/jestjs/jest/pull/14894))
- `[@jest/expect-utils]` Fix not addressing to Sets and Maps as objects without keys ([#14873](https://github.com/jestjs/jest/pull/14873))
- `[jest-haste-map]` Fix errors or clobbering with multiple `hasteImplModulePath`s ([#15522](https://github.com/jestjs/jest/pull/15522))
- `[jest-leak-detector]` Make leak-detector more aggressive when running GC ([#14526](https://github.com/jestjs/jest/pull/14526))
- `[jest-runtime]` Properly handle re-exported native modules in ESM via CJS ([#14589](https://github.com/jestjs/jest/pull/14589))
- `[jest-runtime]` Refactor `_importCoreModel` so required core module is consistent if modified while loading ([#15517](https://github.com/jestjs/jest/pull/15517))
- `[jest-schemas, jest-types]` [**BREAKING**] Fix type of `testFailureExitCode` config option([#15232](https://github.com/jestjs/jest/pull/15232))
- `[jest-util]` Make sure `isInteractive` works in a browser ([#14552](https://github.com/jestjs/jest/pull/14552))
- `[pretty-format]` [**BREAKING**] Print `ArrayBuffer` and `DataView` correctly ([#14290](https://github.com/jestjs/jest/pull/14290))
- `[pretty-format]` Fixed a bug where "anonymous custom elements" were not being printed as expected. ([#15138](https://github.com/jestjs/jest/pull/15138))
- `[jest-cli]` When specifying paths on the command line, only match against the relative paths of the test files ([#12519](https://github.com/jestjs/jest/pull/12519))
  - [**BREAKING**] Changes `testPathPattern` configuration option to `testPathPatterns`, which now takes a list of patterns instead of the regex.
  - [**BREAKING**] `--testPathPattern` is now `--testPathPatterns`
  - [**BREAKING**] Specifying `testPathPatterns` when programmatically calling `watch` must be specified as `new TestPathPatterns(patterns)`, where `TestPathPatterns` can be imported from `@jest/pattern`
- `[jest-reporters, jest-runner]` Unhandled errors without stack get correctly logged to console ([#14619](https://github.com/jestjs/jest/pull/14619))
- `[jest-util]` Always load `mjs` files with `import` ([#15447](https://github.com/jestjs/jest/pull/15447))
- `[jest-worker]` Properly handle a circular reference error when worker tries to send an assertion fails where either the expected or actual value is circular ([#15191](https://github.com/jestjs/jest/pull/15191))
- `[jest-worker]` Properly handle a BigInt when worker tries to send an assertion fails where either the expected or actual value is BigInt ([#15191](https://github.com/jestjs/jest/pull/15191))
- `[expect]` Resolve issue where `ObjectContaining` matched non-object values. [#15463](https://github.com/jestjs/jest/pull/15463).
  - Adds a `conditional/check` to ensure the argument passed to `expect` is an object.
  - Add unit tests for new `ObjectContaining` behavior.
  - Remove `invalid/wrong` test case assertions for `ObjectContaining`.
- `[jest-worker]` Addresses incorrect state on exit ([#15610](https://github.com/jestjs/jest/pull/15610))

### Performance

- `[*]` [**BREAKING**] Bundle all of Jest's modules into `index.js` ([#12348](https://github.com/jestjs/jest/pull/12348), [#14550](https://github.com/jestjs/jest/pull/14550) & [#14661](https://github.com/jestjs/jest/pull/14661))
- `[jest-haste-map]` Only spawn one process to check for `watchman` installation ([#14826](https://github.com/jestjs/jest/pull/14826))
- `[jest-runner]` Better cleanup `source-map-support` after test to resolve (minor) memory leak ([#15233](https://github.com/jestjs/jest/pull/15233))
- `[jest-resolver]` Migrate `resolve` and `resolve.exports` to `unrs-resolver` ([#15619](https://github.com/jestjs/jest/pull/15619))
- `[jest-circus, jest-environment-node, jest-repl, jest-runner, jest-util]` Cleanup global variables on environment teardown to reduce memory leaks ([#15215](https://github.com/jestjs/jest/pull/15215) & [#15636](https://github.com/jestjs/jest/pull/15636) & [#15643](https://github.com/jestjs/jest/pull/15643))

### Chore & Maintenance

- `[jest-environment-jsdom, jest-environment-jsdom-abstract]` Increased version of jsdom to `^26.0.0` ([#15473](https://github.com/jestjs/jest/pull/15473))
- `[*]` Increase version of `micromatch` to `^4.0.7` ([#15082](https://github.com/jestjs/jest/pull/15082))
- `[*]` [**BREAKING**] Drop support for Node.js versions 14, 16, 19, 21 and 23 ([#14460](https://github.com/jestjs/jest/pull/14460), [#15118](https://github.com/jestjs/jest/pull/15118), [#15623](https://github.com/jestjs/jest/pull/15623), [#15640](https://github.com/jestjs/jest/pull/15640))
- `[*]` [**BREAKING**] Drop support for `typescript@4.3`, minimum version is now `5.4` ([#14542](https://github.com/jestjs/jest/pull/14542), [#15621](https://github.com/jestjs/jest/pull/15621))
- `[*]` Depend on exact versions of monorepo dependencies instead of `^` range ([#14553](https://github.com/jestjs/jest/pull/14553))
- `[*]` [**BREAKING**] Add ESM wrapper for all of Jest's modules ([#14661](https://github.com/jestjs/jest/pull/14661))
- `[*]` [**BREAKING**] Upgrade to `glob@10` ([#14509](https://github.com/jestjs/jest/pull/14509))
- `[*]` Use `TypeError` over `Error` where appropriate ([#14799](https://github.com/jestjs/jest/pull/14799))
- `[docs]` Fix typos in `CHANGELOG.md` and `packages/jest-validate/README.md` ([#14640](https://github.com/jestjs/jest/pull/14640))
- `[docs]` Don't use alias matchers in docs ([#14631](https://github.com/jestjs/jest/pull/14631))
- `[babel-jest, babel-preset-jest]` [**BREAKING**] Increase peer dependency of `@babel/core` to `^7.11` ([#14109](https://github.com/jestjs/jest/pull/14109))
- `[babel-jest, @jest/transform]` Update `babel-plugin-istanbul` to v6 ([#15156](https://github.com/jestjs/jest/pull/15156))
- `[babel-plugin-jest-hoist]` Move unnecessary `dependencies` to `devDependencies` ([#15010](https://github.com/jestjs/jest/pull/15010))
- `[expect]` [**BREAKING**] Remove `.toBeCalled()`, `.toBeCalledTimes()`, `.toBeCalledWith()`, `.lastCalledWith()`, `.nthCalledWith()`, `.toReturn()`, `.toReturnTimes()`, `.toReturnWith()`, `.lastReturnedWith()`, `.nthReturnedWith()` and `.toThrowError()` matcher aliases ([#14632](https://github.com/jestjs/jest/pull/14632))
- `[jest-cli, jest-config, @jest/types]` [**BREAKING**] Remove deprecated `--init` argument ([#14490](https://github.com/jestjs/jest/pull/14490))
- `[jest-config, @jest/core, jest-util]` Upgrade `ci-info` ([#14655](https://github.com/jestjs/jest/pull/14655))
- `[jest-mock]` [**BREAKING**] Remove `MockFunctionMetadataType`, `MockFunctionMetadata` and `SpyInstance` types ([#14621](https://github.com/jestjs/jest/pull/14621))
- `[@jest/reporters]` Upgrade `istanbul-lib-source-maps` ([#14924](https://github.com/jestjs/jest/pull/14924))
- `[jest-schemas]` Upgrade `@sinclair/typebox` ([#14775](https://github.com/jestjs/jest/pull/14775))
- `[jest-transform]` Upgrade `write-file-atomic` ([#14274](https://github.com/jestjs/jest/pull/14274))
- `[jest-util]` Upgrade `picomatch` to v4 ([#14653](https://github.com/jestjs/jest/pull/14653) & [#14885](https://github.com/jestjs/jest/pull/14885))
- `[docs] Append to NODE_OPTIONS, not overwrite ([#14730](https://github.com/jestjs/jest/pull/14730))`
- `[docs]` Updated `.toHaveBeenCalled()` documentation to correctly reflect its functionality ([#14842](https://github.com/jestjs/jest/pull/14842))
- `[docs]` Link NestJS documentation on testing with Jest ([#14940](https://github.com/jestjs/jest/pull/14940))
- `[docs]` `Revised documentation for .toHaveBeenCalled()` to accurately depict its functionality. ([#14853](https://github.com/jestjs/jest/pull/14853))
- `[docs]` Removed ExpressJS reference link from documentation due to dead link ([#15270](https://github.com/jestjs/jest/pull/15270))
- `[docs]` Correct broken links in docs ([#15359](https://github.com/jestjs/jest/pull/15359))

## Older Changelog Entries

For older CHANGELOG entries see [`CHANGELOG_PRE_v30.md`](CHANGELOG_PRE_v30.md).
