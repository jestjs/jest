## 0.5.6

* Cache test run performance and run slowest tests first to maximiz worker
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
