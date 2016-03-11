/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const Test = require('./Test');

const fs = require('graceful-fs');
const getCacheFilePath = require('node-haste').Cache.getCacheFilePath;
const getCacheKey = require('./lib/getCacheKey');
const mkdirp = require('mkdirp');
const path = require('path');
const promisify = require('./lib/promisify');
const utils = require('./lib/utils');
const workerFarm = require('worker-farm');

const TEST_WORKER_PATH = require.resolve('./TestWorker');
const HIDDEN_FILE_RE = /\/\.[^\/]*$/;

function optionPathToRegex(p) {
  return utils.escapeStrForRegex(p.replace(/\//g, path.sep));
}

class TestRunner {

  constructor(config, options) {
    this._opts = Object.assign(
      {
        // When true, runs all tests serially in the current process, rather
        // than parallelizing test runs.
        runInBand: options.maxWorkers <= 1,
      },
      options
    );
    this._config = Object.freeze(config);

    try {
      mkdirp.sync(this._config.cacheDirectory, '777');
    } catch (e) {
      if (e.code !== 'EEXIST') {
        throw e;
      }
    }

    const Resolver = require(config.moduleResolver);
    this._resolver = new Resolver(config, {
      resetCache: !config.cache,
    });

    this._testPathDirsRegExp = new RegExp(
      config.testPathDirs
        .map(dir => optionPathToRegex(dir))
        .join('|')
    );

    this._nodeHasteTestRegExp = new RegExp(
      optionPathToRegex(path.sep + config.testDirectoryName + path.sep) +
      '.*\\.(' +
        config.testFileExtensions
          .map(ext => utils.escapeStrForRegex(ext))
          .join('|') +
      ')$'
    );

    // Map from testFilePath -> time it takes to run the test. Used to
    // optimally schedule bigger test runs.
    this._testPerformanceCache = null;
  }

  _getAllTestPaths() {
    return this._resolver
      .matchFilesByPattern(this._config.testDirectoryName)
      .then(paths => paths.filter(path => this._isTestFilePath(path)));
  }

  _isTestFilePath(path) {
    const testPathIgnorePattern =
      this._config.testPathIgnorePatterns.length
      ? new RegExp(this._config.testPathIgnorePatterns.join('|'))
      : null;

    return (
      this._nodeHasteTestRegExp.test(path)
      && !HIDDEN_FILE_RE.test(path)
      && (!testPathIgnorePattern || !testPathIgnorePattern.test(path))
      && this._testPathDirsRegExp.test(path)
    );
  }

  collectChangedModules(relatedPaths, moduleMap, changed) {
    const visitedModules = new Set();
    while (changed.size) {
      changed = new Set(moduleMap.filter(module => (
        !visitedModules.has(module.path) &&
        module.dependencies.some(dep => dep && changed.has(dep))
      )).map(module => {
        const path = module.path;
        if (this._isTestFilePath(path)) {
          relatedPaths.add(path);
        }
        visitedModules.add(path);
        return module.name;
      }));
    }
    return relatedPaths;
  }

  promiseTestPathsRelatedTo(changedPaths) {
    if (!changedPaths.size) {
      return Promise.resolve([]);
    }
    const relatedPaths = new Set();
    return this._resolver.getAllModules().then(allModules => {
      const changed = new Set();
      for (const path of changedPaths) {
        if (this._resolver.getFS().fileExists(path)) {
          const module = this._resolver.getModuleForPath(path);
          if (module) {
            changed.add(module.path);
            if (this._isTestFilePath(module.path)) {
              relatedPaths.add(module.path);
            }
          }
        }
      }
      return Promise.all(Object.keys(allModules).map(path =>
        this._resolver.getShallowDependencies(path)
          .then(response => ({
            name: path,
            path,
            dependencies: response.dependencies.map(dep => dep.path),
          }))
      )).then(moduleMap => Array.from(this.collectChangedModules(
        relatedPaths,
        moduleMap,
        changed
      )));
    });
  }

  promiseHasteTestPathsRelatedTo(changedPaths) {
    if (!changedPaths.size) {
      return Promise.resolve([]);
    }

    return Promise.all([
      this._getAllTestPaths(),
      this._resolver.getHasteMap(),
    ]).then(response => {
      const testPaths = response[0];
      const hasteMap = response[1];
      const relatedPaths = new Set();
      const changed = new Set();
      const moduleMap = [];
      testPaths.forEach(path => {
        if (changedPaths.has(path) && this._isTestFilePath(path)) {
          relatedPaths.add(path);
        }
        moduleMap.push({name: path, path, dependencies: null});
      });
      const collectModules = list => {
        for (const name in list) {
          const path = list[name];
          if (changedPaths.has(path)) {
            changed.add(name);
            if (this._isTestFilePath(path)) {
              relatedPaths.add(path);
            }
          }
          moduleMap.push({name, path, dependencies: null});
        }
      };
      collectModules(hasteMap.modules);
      collectModules(hasteMap.mocks);

      const deferreds = moduleMap.map(() => {
        let resolve;
        const promise = new Promise(_resolve => resolve = _resolve);
        return {resolve, promise};
      });
      let i = 0;
      const nextResolution = () => {
        if (i >= moduleMap.length) {
          return;
        }

        const currentIndex = i;
        const module = moduleMap[currentIndex];
        const deferred = deferreds[currentIndex];
        i++;
        this._resolver.getModuleForPath(module.path).getDependencies()
          .then(dependencies => {
            nextResolution();
            moduleMap[currentIndex].dependencies = dependencies;
          })
          .then(() => deferred.resolve());
      };

      for (let i = 0; i < 20; i++) {
        nextResolution();
      }
      return Promise.all(deferreds.map(deferred => deferred.promise))
        .then(() => Array.from(this.collectChangedModules(
          relatedPaths,
          moduleMap,
          changed
        )));
    });
  }

  promiseTestPathsMatching(pathPattern) {
    return this._getAllTestPaths()
      .then(paths => paths.filter(path => pathPattern.test(path)));
  }

  _getTestPerformanceCachePath() {
    const config = this._config;
    return path.join(config.cacheDirectory, 'perf-cache-' + config.name);
  }

  _sortTests(testPaths) {
    // When running more tests than we have workers available, sort the tests
    // by size - big test files usually take longer to complete, so we run
    // them first in an effort to minimize worker idle time at the end of a
    // long test run.
    //
    // After a test run we store the time it took to run a test and on
    // subsequent runs we use that to run the slowest tests first, yielding the
    // fastest results.
    try {
      this._testPerformanceCache = JSON.parse(fs.readFileSync(
        this._getTestPerformanceCachePath()
      ));
    } catch (e) {}

    const testPerformanceCache = this._testPerformanceCache;
    if (testPaths.length > this._opts.maxWorkers) {
      testPaths = testPaths
        .map(path => [path, fs.statSync(path).size])
        .sort((a, b) => {
          const cacheA = testPerformanceCache && testPerformanceCache[a[0]];
          const cacheB = testPerformanceCache && testPerformanceCache[b[0]];
          if (cacheA !== null && cacheB !== null) {
            return cacheA < cacheB ? 1 : -1;
          }
          return a[1] < b[1] ? 1 : -1;
        })
        .map(p => p[0]);
    }

    return testPaths;
  }

  _cacheTestResults(aggregatedResults) {
    const cacheFile = this._getTestPerformanceCachePath();
    let cache = this._testPerformanceCache;
    if (!cache) {
      cache = this._testPerformanceCache = {};
    }
    aggregatedResults.testResults.forEach(test => {
      const perf = test && test.perfStats;
      if (perf && perf.end && perf.start) {
        cache[test.testFilePath] = perf.end - perf.start;
      }
    });
    return promisify(fs.writeFile)(cacheFile, JSON.stringify(cache));
  }

  runTests(testPaths, reporter) {
    const config = this._config;
    if (!reporter) {
      const TestReporter = require(config.testReporter);
      if (config.useStderr) {
        reporter = new TestReporter(Object.create(
          process,
          {stdout: {value: process.stderr}}
        ));
      } else {
        reporter = new TestReporter();
      }
    }

    testPaths = this._sortTests(testPaths);

    const aggregatedResults = {
      success: null,
      startTime: null,
      numTotalTestSuites: testPaths.length,
      numPassedTestSuites: 0,
      numFailedTestSuites: 0,
      numRuntimeErrorTestSuites: 0,
      numTotalTests: 0,
      numPassedTests: 0,
      numFailedTests: 0,
      numPendingTests: 0,
      testResults: [],
      postSuiteHeaders: [],
    };

    reporter.onRunStart && reporter.onRunStart(config, aggregatedResults);

    const onTestResult = (testPath, testResult) => {
      aggregatedResults.testResults.push(testResult);
      aggregatedResults.numTotalTests +=
        testResult.numPassingTests +
        testResult.numFailingTests +
        testResult.numPendingTests;

      aggregatedResults.numFailedTests += testResult.numFailingTests;
      aggregatedResults.numPassedTests += testResult.numPassingTests;
      aggregatedResults.numPendingTests += testResult.numPendingTests;
      if (testResult.numFailingTests > 0) {
        aggregatedResults.numFailedTestSuites++;
      } else {
        aggregatedResults.numPassedTestSuites++;
      }
      reporter.onTestResult && reporter.onTestResult(
        config,
        testResult,
        aggregatedResults
      );
    };

    const onRunFailure = (testPath, err) => {
      const testResult = {
        testFilePath: testPath,
        testExecError: err,
        testResults: [],
      };
      aggregatedResults.testResults.push(testResult);
      aggregatedResults.numRuntimeErrorTestSuites++;
      if (reporter.onTestResult) {
        reporter.onTestResult(config, testResult, aggregatedResults);
      }
    };

    aggregatedResults.startTime = Date.now();
    const testRun = this._createTestRun(testPaths, onTestResult, onRunFailure);

    return testRun
      .then(() => {
        aggregatedResults.success =
          aggregatedResults.numFailedTests === 0 &&
          aggregatedResults.numRuntimeErrorTestSuites === 0;
        if (reporter.onRunComplete) {
          reporter.onRunComplete(config, aggregatedResults);
        }
        return aggregatedResults;
      })
      .then(results => Promise.all([
        this._cacheTestResults(results),
        this.end(),
      ]).then(() => results));
  }

  end() {
    return this._resolver.end();
  }

  _createTestRun(testPaths, onTestResult, onRunFailure) {
    if (this._opts.runInBand || testPaths.length <= 1) {
      return this._createInBandTestRun(testPaths, onTestResult, onRunFailure);
    } else {
      return this._createParallelTestRun(testPaths, onTestResult, onRunFailure);
    }
  }

  _createInBandTestRun(testPaths, onTestResult, onRunFailure) {
    return testPaths.reduce((promise, path) =>
      promise
        .then(() => this._resolver.getHasteMap())
        .then(moduleMap => new Test(path, this._config, moduleMap).run())
        .then(result => onTestResult(path, result))
        .catch(err => onRunFailure(path, err)),
      Promise.resolve()
    );
  }

  _persistModuleMap(moduleMap) {
    const cacheFile = getCacheFilePath(
      this._config.cacheDirectory,
      getCacheKey('jest-module-map', this._config)
    );
    return promisify(fs.writeFile)(cacheFile, JSON.stringify(moduleMap));
  }

  _createParallelTestRun(testPaths, onTestResult, onRunFailure) {
    const config = this._config;
    return this._resolver.getHasteMap()
      .then(moduleMap => this._persistModuleMap(moduleMap))
      .then(() => {
        const farm = workerFarm({
          autoStart: true,
          maxConcurrentCallsPerWorker: 1,
          maxRetries: 2, // Allow for a couple of transient errors.
          maxConcurrentWorkers: this._opts.maxWorkers,
        }, TEST_WORKER_PATH);
        const runTest = promisify(farm);
        return Promise.all(testPaths.map(
          path => runTest({path, config})
            .then(testResult => onTestResult(path, testResult))
            .catch(err => {
              onRunFailure(path, err);
              if (err.type === 'ProcessTerminatedError') {
                console.error(
                  'A worker process has quit unexpectedly! ' +
                  'Most likely this an initialization error.'
                );
                process.exit(1);
              }
            }))
        )
        .then(() => workerFarm.end(farm));
      });
  }

}

module.exports = TestRunner;
