## master

## jest-cli 0.9.2, babel-jest 9.0.3

* Improved responsiveness of the system while using `--watch`.
* Fixed `jest -o` issue when no files were changed.
* Improved code coverage reporting when using `babel-jest`.
* Improved error reporting when a syntax error occurs.
* Jest now properly reports pending tests disabled with `xit` and `xdescribe`.

## 0.9.1

* Fixed `--watch`.
* Improved `babel-jest` integration and `react-native` testing.

## 0.9.0

* New implementation of node-haste and rewrite of internal module loading and
  resolution. Fixed both startup and runtime performance.
  [#599](https://github.com/facebook/jest/pull/599)
* Improved verbose logger output
* Fixed and improved `--onlyChanged` option.
* Added a "no tests found" message if no tests can be found.
* Debounce `--watch` re-runs to not trigger test runs during a
  branch switch in version control.
* Fixed mocking of boolean values.
* Fixed mocking of fields that start with an underscore ("private fields").
* Fixed unmocking behavior with npm3.
* Fixed test runtime error reporting and stack traces.
* Jest sets `process.NODE_ENV` to `test` unless otherwise specified.
* Added `babel-plugin-jest-unmock`, `babel-jest-preset` and `babel-jest`
  as packages. `babel-jest` is now being auto-detected.
* Added `jest.fn()` and `jest.fn(implementation)` as convenient shorcuts for
  `jest.genMockFunction()` and `jest.genMockFunction().mockImplementation()`.
* Jasmine 2 is now the default test runner. To keep using Jasmine 1, put
  `testRunner: "jasmine1"` into your configuration.
* Added an `automock` option to turn off automocking globally.
* Added a `testEnvironment` option to customize the sandbox environment.

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
