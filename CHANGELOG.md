## main

### Features

- `[jest-config]` Add `defineConfig` and `mergeConfig` helpers for type-safe Jest config ([#15844](https://github.com/jestjs/jest/pull/15844))
- `[jest-fake-timers]` Add `setTimerTickMode` to configure how timers advance

### Fixes

- `[jest-reporters]` Fix issue where console output not displayed for GHA reporter even with `silent: false` option ([#15864](https://github.com/jestjs/jest/pull/15864))
- `[jest-runtime]` Fix issue where user cannot utilize dynamic import despite specifying `--experimental-vm-modules` Node option ([#15842](https://github.com/jestjs/jest/pull/15842))
- `[jest-test-sequencer]` Fix issue where failed tests due to compilation errors not getting re-executed even with `--onlyFailures` CLI option ([#15851](https://github.com/jestjs/jest/pull/15851))
- `[jest-util]` Make sure `process.features.require_module` is `false` ([#15867](https://github.com/jestjs/jest/pull/15867))

### Chore & Maintenance

- `[docs]` Update V30 migration guide to notify users on `jest.mock()` work with case-sensitive path ([#15849](https://github.com/jestjs/jest/pull/15849))
- `[deps]` Update to sinon/fake-timers v15

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
- `[jest-runtime]` Importing from `@jest/globals` in more than one file no longer breaks relative paths ([#15772](https://github.com/jestjs/jest/issues/15772))

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

- `[jest-diff]` Show non-printable control characters to diffs ([#15696](https://github.com/facebook/jest/pull/15696))

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
- `[jest-circus, jest-jasmine2]` Allow `setupFilesAfterEnv` to export an async function ([#10962](https://github.com/jestjs/jest/issues/10962))
- `[jest-circus, jest-test-result]` Add `startedAt` timestamp in `TestCaseResultObject` within `onTestCaseResult` ([#15145](https://github.com/jestjs/jest/pull/15145))
- `[jest-cli]` Export `buildArgv` ([#15310](https://github.com/facebook/jest/pull/15310))
- `[jest-config]` [**BREAKING**] Add `mts` and `cts` to default `moduleFileExtensions` config ([#14369](https://github.com/facebook/jest/pull/14369))
- `[jest-config]` [**BREAKING**] Update `testMatch` and `testRegex` default option for supporting `mjs`, `cjs`, `mts`, and `cts` ([#14584](https://github.com/jestjs/jest/pull/14584))
- `[jest-config]` Loads config file from provided path in `package.json` ([#14044](https://github.com/facebook/jest/pull/14044))
- `[jest-config]` Allow loading `jest.config.cts` files ([#14070](https://github.com/facebook/jest/pull/14070))
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
- `[expect, @jest/expect]` [**BREAKING**] Add type inference for function parameters in `CalledWith` assertions ([#15129](https://github.com/facebook/jest/pull/15129))
- `[@jest/expect-utils]` Properly compare all types of `TypedArray`s ([#15178](https://github.com/facebook/jest/pull/15178))
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
- `[jest-snapshot]` [**BREAKING**] Add support for [Error causes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause) in snapshots ([#13965](https://github.com/facebook/jest/pull/13965))
- `[jest-snapshot]` Support Prettier 3 ([#14566](https://github.com/facebook/jest/pull/14566))
- `[@jest/util-snapshot]` Extract utils used by tooling from `jest-snapshot` into its own package ([#15095](https://github.com/facebook/jest/pull/15095))
- `[pretty-format]` [**BREAKING**] Do not render empty string children (`''`) in React plugin ([#14470](https://github.com/facebook/jest/pull/14470))

### Fixes

- `[expect]` Show `AggregateError` to display ([#15346](https://github.com/facebook/jest/pull/15346))
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
- `[jest-config]` Support `coverageReporters` in project config ([#14697](https://github.com/jestjs/jest/pull/14830))
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
- `[jest-runtime]` Refactor `_importCoreModel` so required core module is consistent if modified while loading ([#15077](https://github.com/jestjs/jest/issues/15077))
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

- `[jest-environment-jsdom, jest-environment-jsdom-abstract]` Increased version of jsdom to `^26.0.0` ([#15325](https://github.com/jestjs/jest/issues/15325)[CVE-2024-37890](https://nvd.nist.gov/vuln/detail/CVE-2024-37890))
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

For newer CHANGELOG entries see [`CHANGELOG_PRE_v30.md`](CHANGELOG_PRE_v30.md).
