## master

## jest 19.0.0

* Breaking Change: Added a version for snapshots.
* Breaking Change: Removed the `mocksPattern` configuration option, it never worked correctly.
* Breaking Change: Renamed `testPathDirs` to `roots` to avoid confusion when configuring Jest.
* Breaking Change: Updated printing of React elements to cause fewer changes when props change.
* Breaking Change: Updated snapshot format to properly escape data.
* Fixed --color to be recognized correctly again.
* Fixed `babel-plugin-jest-hoist` to work properly with type annotations in tests.
* Fixed behavior for console.log calls and fixed a memory leak (#2539).
* Fixed cache directory path for Jest to avoid ENAMETOOLONG errors.
* Fixed change events to be emitted in jest-haste-map's watch mode. This fixes issues with Jest's new watch mode and react-native-packager.
* Fixed cli arguments to be used when loading the config from file, they were previously ignored.
* Fixed Jest to load json files that include a BOM.
* Fixed Jest to throw errors instead of ignoring invalid cli options.
* Fixed mocking behavior for virtual modules.
* Fixed mocking behavior with transitive dependencies.
* Fixed support for asymmetric matchers in `toMatchObject`.
* Fixed test interruption and `--bail` behavior.
* Fixed watch mode to clean up worker processes when a test run gets interrupted.
* Fixed whitespace to be highlighted in snapshots and assertion errors.
* Improved `babel-jest` plugin: babel is loaded lazily, istanbul comments are only added when coverage is used.
* Improved error for invalid transform config.
* Improved moduleNameMapper to not overwrite mocks when many patterns map to the same file.
* Improved printing of skipped tests in verbose mode.
* Improved resolution code in jest-resolve.
* Improved to only show patch marks in assertion errors when the comparison results in large objects.
* New `--collectCoverageFrom` cli argument.
* New `--coverageDirectory` cli argument.
* New `expect.addSnapshotSerializer` to add custom snapshot serializers for tests.
* New `jest.spyOn`.
* New `testMatch` configuration option that accepts glob patterns.
* New eslint-plugin-jest with no-disabled-tests, no-focuses-tests and no-identical-title rules and default configuration and globals.
* New expect.stringContaining asymmetric matcher.
* New feature to make manual mocks with nested folders work. For example `__mocks__/react-native/Library/Text.js` will now work as expected.
* New jest-phabricator package to integrate Jest code coverage in phabriactor.
* New jest-validate package to improve configuration errors, help with suggestions of correct configuration and to be adopted in other libraries.
* New pretty-printing for asymmetric matchers.
* New RSS feed for Jest's blog.
* New typeahead to filter cached test names added to watch mode.
* New typeahead to filter file names added to watch mode (#2324).
* New way to provide a reducer to extract haste module ids.
* New website, new documentation, new color scheme and new homepage.
* Rewritten watch mode for instant feedback, better code quality and to build new features on top of it (#2362).

## jest 18.1.0

* Fixed console.log and fake timer behavior in node 7.3.
* Updated istanbul-api.
* Updated jest-diff equality error message.
* Disabled arrow keys when entering a pattern in watch mode to prevent broken behavior. Will be improved in a future release.
* Moved asymmetric matchers and equality functionality from Jasmine into jest-matchers.
* Removed jasmine and jest-snapshot dependency from jest-matchers.
* Removed unused global `context` variable.
* Show a better error message if the config is invalid JSON.
* Highlight trailing whitespace in assertion diffs and snapshots.
* Jest now uses micromatch instead of minimatch.
* Added `-h` as alias for `--help`.

## jest 18.0.0

See https://facebook.github.io/jest/blog/2016/12/15/2016-in-jest.html

* The testResultsProcessor function is now required to return the modified results.
* Removed `pit` and `mockImpl`. Use `it` or `mockImplementation` instead.
* Fixed re-running tests when `--bail` is used together with `--watch`.
* `pretty-format` is now merged into Jest.
* `require('v8')` now works properly in a test context.
* Jest now clears the entire scrollback in watch mode.
* Added `expect.any`, `expect.anything`, `expect.objectContaining`, `expect.arrayContaining`, `expect.stringMatching`.
* Properly resolve `snapshotSerializers`, `setupFiles`, `transform`, `testRunner` and `testResultsProcessor` instead of using `path.resolve`.
* `--testResultsProcessor` is now exposed through the cli.
* Renamed `--jsonOutputFile` to `--outputFile`.
* Added `jest-editor-support` for vscode and Nuclide integration.
* Fixed `test.concurrent` unhandled promise rejections.
* The Jest website is now auto-deployed when merging into master.
* Updated `testRegex` to include `test.js` and `spec.js` files.
* Fixes for `babel-plugin-jest-hoist` when using `jest.mock` with three arguments.
* The `JSON` global in `jest-environment-node` now comes from the vm context instead of the parent context.
* Jest does not print stack traces from babel any longer.
* Fake timers are reset when `FakeTimers.useTimers()` is called.
* Usage of Jest in watch mode can be hidden through `JEST_HIDE_USAGE`.
* Added `expect.assertions(number)` which will ensure that a specified amount of assertions is made in one test.
* Added `.toMatchSnapshot(?string)` feature to give snapshots a name.
* Escape regex in snapshots.
* `jest-react-native` was deprecated and now forwards `react-native`.
* Added `.toMatchObject` matcher.
* Further improve printing of large objects.
* Fixed `NaN% Failed` in the OS notification when using `--notify`.
* The first test run without cached timings will now use separate processes instead of running in band.
* Added `.toHaveProperty` matcher.
* Fixed `Map`/`Set` comparisons.
* `test.concurrent` now works with `--testNamePattern`.

## jest 17.0.3

* Improved file-watching feature in jest-haste-map.
* Added `.toHaveLength` matcher.
* Improved `.toContain` matcher.

## jest 17.0.2

* Fixed performance regression in module resolution.

## jest 17.0.1

* Fixed pretty printing of big objects.
* Fixed resolution of `.native.js` files in react-native projects.

## jest 17.0.0

* Added `expect.extend`.
* Properly resolve modules with platform extensions on react-native.
* Added support for custom snapshots serializers.
* Updated to Jasmine 2.5.2.
* Big diffs are now collapsed by default in snapshots and assertions. Added `--expand` (or `-e`) to show the full diff.
* Replaced `scriptPreprocessor` with the new `transform` option.
* Added `jest.resetAllMocks` which replaces `jest.clearAllMocks`.
* Fixes for react-native preset.
* Fixes for global built in objects in `jest-environment-node`.
* Create mock objects in the vm context instead of the parent context.
* `.babelrc` is now part of the transform cache key in `babel-jest`.
* Fixes for docblock parsing with haste modules.
* Exit with the proper code when the coverage threshold is not reached.
* Implemented file watching in `jest-haste-map`.
* `--json` now includes information about individual tests inside a file.

## jest 16.0.2

* Symbols are now properly mocked when using `jest-mock`.
* `toHaveBeenCalledWith()` works without arguments again.
* Newlines in snapshots are now normalized across different operating systems.

## jest 16.0.1

* Fix infinite loop.

## jest 16.0.0

* Previously failed tests are now always run first.
* A new concurrent reporter shows currently running tests, a test summary, a progress bar and estimated remaining time if possible.
* Improved CLI colors.
* `jest <pattern>` is now case-insensitive.
* Added `it.only`, `it.skip`, `test.only`, `test.skip` and `xtest`.
* Added `--testNamePattern=pattern` or `-t <pattern>` to run individual tests in test files.
* Jest now warns for duplicate mock files.
* Pressing `a`, `o`, `p`, `q` or `enter` while tests are running in the watch mode, the test run will be interrupted.
* `--bail` now works together with `--watch`.
* Added `test.concurrent` for concurrent async tests.
* Jest now automatically considers files and tests with the `.jsx` extension.
* Added `jest.clearAllMocks` to clear all mocks manually.
* Rewrote Jest's snapshot implementation. `jest-snapshot` can now be more easily integrated into other test runners and used in other projects.
 * This requires most snapshots to be updated when upgrading Jest.
 * Objects and Arrays in snapshots are now printed with a trailing comma.
 * Function names are not printed in snapshots any longer to reduce issues with code coverage instrumentation and different Node versions.
 * Snapshots are now sorted using natural sort order.
 * Snapshots are not marked as obsolete any longer when using `fit` or when an error is thrown in a test.
* Finished migration of Jasmine matchers to the new Jest matchers.
 * Pretty print `toHaveBeenLastCalledWith`, `toHaveBeenCalledWith`,  `lastCalledWith` and `toBeCalledWith` failure messages.
 * Added `toBeInstanceOf` matcher.
 * Added `toContainEqual` matcher.
 * Added `toThrowErrorMatchingSnapshot` matcher.
* Improved `moduleNameMapper` resolution.
* Module registry fixes.
* Fixed invocation of the `setupTestFrameworkScriptFile` script to make it easier to use chai together with Jest.
* Removed react-native special case in Jest's configuration.
* Added `--findRelatedTests <fileA> <fileB>` cli option to run tests related to the specified files.
* Added `jest.deepUnmock` to `babel-plugin-jest-hoist`.
* Added `jest.runTimersToTime` which is useful together with fake timers.
* Improved automated mocks for ES modules compiled with babel.

## jest 15.1.1

* Fixed issues with test paths that include hyphens on Windows.
* Fixed `testEnvironment` resolution.
* Updated watch file name pattern input.

## jest 15.1.0

* Pretty printer updates for React and global window objects.
* `jest-runtime` overwrites automocking from configuration files.
* Improvements for watch mode on Windows.
* afterAll/afterEach/beforeAll/beforeEach can now return a Promise and be used together with async/await.
* Improved stack trace printing on Node 4.

## jest 15.0.2

* Fixed Jest with npm2 when using coverage.

## jest 15.0.1

* Updated toThrow and toThrowMatchers and aliased them to the same matcher.
* Improvements for watch mode.
* Fixed Symbol reassignment in tests would break Jest's matchers.
* Fixed `--bail` option.

## jest 15.0.0

* See https://facebook.github.io/jest/blog/2016/09/01/jest-15.html
* Jest by default now also recognizes files ending in `.spec.js` and `.test.js` as test files.
* Completely replaced most Jasmine matchers with new Jest matchers.
* Rewrote Jest's CLI output for test failures and summaries.
* Added `--env` option to override the default test environment.
* Disabled automocking, fake timers and resetting the module registry by default.
* Added `--watchAll`, made `--watch` interactive and added the ability to update snapshots and select test patterns in watch mode.
* Jest uses verbose mode when running a single test file.
* Console messages are now buffered and printed along with the test results.
* Fix `testEnvironment` resolution to prefer `jest-environment-{name}` instead of `{name}` only. This prevents a module colision when using `jsdom` as test environment.
* `moduleNameMapper` now uses a resolution algorithm.
* Improved performance for small test runs.
* Improved API documentation.
* Jest now works properly with directories that have special characters in them.
* Improvements to Jest's own test infra by merging integration and unit tests. Code coverage is now collected for Jest.
* Added `global.global` to the node environment.
* Fixed babel-jest-plugin-hoist issues with functions called `mock`.
* Improved jest-react-native preset with mocks for ListView, TextInput, ActivityIndicator and ScrollView.
* Added `collectCoverageFrom` to collect code coverage from untested files.
* Rewritten code coverage support.

## jest 14.1.0

* Changed Jest's default cache directory.
* Fixed `jest-react-native` for react 15.3.0.
* Updated react and react-native example to use `react-test-renderer`.
* Started to refactor code coverage.

## jest 14.0.2

* `babel-jest` bugfix.

## jest 14.0.1

* `babel-jest` can now be used to compose a transformer.
* Updated snapshot instructions to run `jest -u` or `npm test -- -u`.
* Fixed `config` cli option to enable JSON objects as configuration.
* Updated printing of preset path in the CLI.

## jest 14.0.0

* Official release of snapshot tests.
* Started to replace Jasmine matchers with Jest matchers: `toBe`,
  `toBeFalsy`, `toBeTruthy`, `toBeNaN`,
  `toBe{Greater,Less}Than{,OrEqual}`, `toBeNull`, `toBeDefined`,
  `toBeUndefined`, `toContain`, `toMatch`, `toBeCloseTo` were rewritten.
* Rewrite of Jest's reporters.
* Experimental react-native support.
* Removed Jasmine 1 support from Jest.
* Transform caching improvements.

## jest 13.2.0

* Snapshot bugfixes.
* Timer bugfixes.

## jest 13.1.0

* Added `test` global function as an alias for `it`.
* Added `coveragePathIgnorePatterns` to the config.
* Fixed printing of "JSX objects" in snapshots.
* Fixes for `--verbose` option and top level `it` calls.
* Extended the node environment with more globals.
* testcheck now needs to be required explicitly through
  `require('jest-check')`.
* Added `jest.deepUnmock`.
* Fail test suite if it does not contain any tests.

## jest 13.0.0

* Added duration of individual tests in verbose mode.
* Added a `browser` config option to properly resolve npm packages with a
  browser field in `package.json` if you are writing tests for client side apps
* Added `jest-repl`.
* Split up `jest-cli` into `jest-runtime` and `jest-config`.
* Added a notification plugin that shows a test run notification
  using `--notify`.
* Refactored `TestRunner` into `SearchSource` and improved the
  "no tests found" message.
* Added `jest.isMockFunction(jest.fn())` to test for mock functions.
* Improved test reporter printing and added a test failure summary when
  running many tests.
  * Add support for property testing via testcheck-js.
* Added a webpack tutorial.
* Added support for virtual mocks through
  `jest.mock('Module', implementation, {virtual: true})`.
* Added snapshot functionality through `toMatchSnapshot()`.
* Redesigned website.

## jest-cli 12.1.1

* Windows stability fixes.
* Mock module resolution fixes.
* Remove test files from code coverage.

## jest-cli 12.1.0

* Jest is now also published in the `jest` package on npm.
* Added `testRegex` to match for tests outside of specific folders. Deprecated
  both `testDirectoryName` and `testFileExtensions`.
* `it` can now return a Promise for async testing. `pit` was deprecated.
* Added `jest-resolve` as a standalone package based on the Facebook module
  resolution algorithm.
* Added `jest-changed-files` as a standalone package to detect changed files
  in a git or hg repo.
* Added `--setupTestFrameworkFile` to cli.
* Added support for coverage thresholds. See http://facebook.github.io/jest/docs/api.html#coveragethreshold-object.
* Updated to jsdom 9.0.
* Updated and improved stack trace reporting.
* Added `module.filename` and removed the invalid `module.__filename` field.
* Further improved the `lastCalledWith` and `toBeCalledWith` custom matchers.
  They now print the most recent calls.
* Fixed jest-haste-map on continuous integration systems.
* Fixes for hg/git integration.
* Added a re-try for the watchman crawler.

## jest-cli 12.0.2

* Bug fixes when running a single test file and for scoped package names.

## jest-cli 12.0.1

* Added custom equality matchers for Map/Set and iterables.
* Bug fixes

## jest-cli 12.0.0

* Reimplemented `node-haste` as `jest-haste-map`:
  https://github.com/facebook/jest/pull/896
* Fixes for the upcoming release of nodejs 6.
* Removed global mock caching which caused negative side-effects on test runs.
* Updated Jasmine from 2.3.4 to 2.4.1.
* Fixed our Jasmine fork to work better with `Object.create(null)`.
* Added a `--silent` flag to silence console messages during a test run.
* Run a test file directly if a path is passed as an argument to Jest.
* Added support for the undocumented nodejs feature `module.paths`.

## jest-cli 11.0.2

* Fixed `jest -o` error when Mercurial isn't installed on the system
* Fixed Jasmine failure message when expected values were mutated after tests.

## jest-cli 11.0.1, babel-jest 11.0.1

* Added support for Mercurial repositories when using `jest -o`
* Added `mockImplementationOnce` API to `jest.fn()`.

## jest-cli 11.0.0, babel-jest 11.0.0 (pre-releases 0.9 to 0.10)

* New implementation of node-haste and rewrite of internal module loading and
  resolution. Fixed both startup and runtime performance.
  [#599](https://github.com/facebook/jest/pull/599)
* Jasmine 2 is now the default test runner. To keep using Jasmine 1, put
  `testRunner: "jasmine1"` into your configuration.
* Added `jest-util`, `jest-mock`, `jest-jasmine1`, `jest-jasmine2`,
  `jest-environment-node`, `jest-environment-jsdom` packages.
* Added `babel-jest-preset` and `babel-jest` as packages. `babel-jest` is now
  being auto-detected.
* Added `babel-plugin-jest-hoist` which hoists `jest.unmock`, `jest.mock` and
  the new `jest.enableAutomock` and `jest.disableAutomock` API.
* Improved `babel-jest` integration and `react-native` testing.
* Improved code coverage reporting when using `babel-jest`.
* Added the `jest.mock('moduleName', moduleFactory)` feature. `jest.mock` now
  gets hoisted by default. `jest.doMock` was added to explicitly mock a module
  without the hoisting feature of `babel-jest`.
* Updated jsdom to 8.3.x.
* Improved responsiveness of the system while using `--watch`.
* Clear the terminal window when using `--watch`.
* By default, `--watch` will now only runs tests related to changed files.
  `--watch=all` can be used to run all tests on file system changes.
* Debounce `--watch` re-runs to not trigger test runs during a
  branch switch in version control.
* Added `jest.fn()` and `jest.fn(implementation)` as convenient shorcuts for
  `jest.genMockFunction()` and `jest.genMockFunction().mockImplementation()`.
* Added an `automock` option to turn off automocking globally.
* Added a "no tests found" message if no tests can be found.
* Jest sets `process.NODE_ENV` to `test` unless otherwise specified.
* Fixed `moduleNameMapper` config option when used with paths.
* Fixed an error with Jasmine 2 and tests that `throw 'string errors'`.
* Fixed issues with unmocking symlinked module names.
* Fixed mocking of boolean values.
* Fixed mocking of fields that start with an underscore ("private fields").
* Fixed unmocking behavior with npm3.
* Fixed and improved `--onlyChanged` option.
* Fixed support for running Jest as a git submodule.
* Improved verbose logger output
* Fixed test runtime error reporting and stack traces.
* Improved `toBeCalled` Jasmine 2 custom matcher messages.
* Improved error reporting when a syntax error occurs.
* Renamed HasteModuleLoader to Runtime.
* Jest now properly reports pending tests disabled with `xit` and `xdescribe`.
* Removed `preprocessCachingDisabled` config option.
* Added a `testEnvironment` option to customize the sandbox environment.
* Added support for `@scoped/name` npm packages.
* Added an integration test runner for Jest that runs all tests for examples
  and packages.

## 0.8.2

* Performance improvements.
* jest now uses `chalk` instead of its own colors implementation.

## 0.8.1

* `--bail` now reports with the proper error code.
* Fixed loading of the setup file when using jasmine2.
* Updated jsdom to 7.2.0.

## 0.8.0

* Added optional support for jasmine2 through the `testRunner` config option.
* Fixed mocking support for Map, WeakMap and Set.
* `node` was added to the defaults in `moduleFileExtensions`.
* Updated the list of node core modules that are properly being recognized by
  the module loader.

## 0.7.1

* Correctly map `process.on` into jsdom environments, fixes a bug introduced in
  jest 0.7.0.

## 0.7.0

* Fixed a memory leak with test contexts. Jest now properly cleans up
  test environments after each test. Added `--logHeapUsage` to log memory
  usage after each test. Note: this is option is meant for debugging memory
  leaks and might significantly slow down your test run.
* Removed `mock-modules`, `node-haste` and `mocks` virtual modules. This is a
  breaking change of undocumented public API. Usage of this API can safely be
  automatically updated through an automated codemod:
 * Example: http://astexplorer.net/#/zrybZ6UvRA
 * Codemod: https://github.com/cpojer/js-codemod/blob/master/transforms/jest-update.js
 * jscodeshift: https://github.com/facebook/jscodeshift
* Removed `navigator.onLine` and `mockSetReadOnlyProperty` from the global jsdom
  environment. Use `window.navigator.onLine = true;` in your test setup and
  `Object.defineProperty` instead.

## 0.6.1

* Updated jsdom to 7.0.2.
* Use the current working directory as root when passing a jest config from
  the command line.
* Updated the React examples and getting started guide
* Modules now receive a `module.parent` field so unmocked modules don't assume
  they are run directly any longer.

## 0.6.0

* jest now reports the number of tests that were run instead of the number of
  test files.
* Added a `--json` option to print test results as JSON.
* Changed the preprocessor API. A preprocessor now receives the script, file and
  config. The cache key function receives the script, file and stringified
  config to be able to create consistent hashes.
* Removed node-worker-pool in favor of node-worker-farm (#540).
* `toEqual` now also checks the internal class name of an object. This fixes
  invalid tests like `expect([]).toEqual({})` which were previously passing.
* Added the option to provide map modules to stub modules by providing the
  `moduleNameMapper` config option.
* Allow to specify a custom `testRunner` in the configuration (#531).
* Added a `--no-cache` option to make it easier to debug preprocessor scripts.
* Fix code coverage on windows (#499).

## 0.5.6

* Cache test run performance and run slowest tests first to maximize worker
  utilization
* Update to jsdom 6.5.0

## 0.5.5

* Improve failure stack traces.
* Fix syntax error reporting.
* Add `--watch` option (#472).

## 0.5.2

* Fixed a bug with syntax errors in test files (#487).
* Fixed chmod error for preprocess-cache (#491).
* Support for the upcoming node 4.0 release (#490, #489).

## 0.5.1

* Upgraded node-worker-pool to 3.0.0, use the native `Promise` implementation.
* `testURL` can be used to set the location of the jsdom environment.
* Updated all of jest's dependencies, now using jsdom 6.3.
* jest now uses the native `Promise` implementation.
* Fixed a bug when passed an empty `testPathIgnorePatterns`.
* Moved preprocessor cache into the haste cache directory.

## 0.5.0

* Added `--noStackTrace` option to disable stack traces.
* Jest now only works with iojs v2 and up. If you are still using node we
  recommend upgrading to iojs or keep using jest 0.4.0.
* Upgraded to jsdom 6.1.0 and removed all the custom jsdom overwrites.

## <=0.4.0

* See commit history for changes in previous versions of jest.
