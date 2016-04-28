## master

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
