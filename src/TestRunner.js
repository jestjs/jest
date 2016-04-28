/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const H = require('jest-haste-map').H;
const Test = require('./Test');

const createHasteMap = require('./lib/createHasteMap');
const fs = require('graceful-fs');
const getCacheFilePath = require('jest-haste-map').getCacheFilePath;
const mkdirp = require('mkdirp');
const path = require('path');
const promisify = require('./lib/promisify');
const resolveNodeModule = require('./lib/resolveNodeModule');
const utils = require('jest-util');
const workerFarm = require('worker-farm');

const TEST_WORKER_PATH = require.resolve('./TestWorker');
const HIDDEN_FILE_RE = /\/\.[^\/]*$/;

function optionPathToRegex(p) {
  return utils.escapeStrForRegex(p.replace(/\//g, path.sep));
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.R_OK);
    return true;
  } catch (e) {}
  return false;
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

    this._hasteMap = createHasteMap(config, {
      maxWorkers: options.runInBand ? 1 : this._opts.maxWorkers,
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

    // warm-up the haste map
    this._hasteMap.build();
  }

  _getAllTestPaths() {
    return this._hasteMap
      .matchFiles(this._config.testDirectoryName)
      .then(paths => paths.filter(path => this.isTestFilePath(path)));
  }

  isTestFilePath(path) {
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

  promiseTestPathsRelatedTo(changedPaths) {
    const collectChangedModules = (relatedPaths, moduleMap, changed) => {
      const visitedModules = new Set();
      while (changed.size) {
        changed = new Set(moduleMap.filter(module => (
          !visitedModules.has(module.file) &&
          module.dependencies.some(dep => dep && changed.has(dep))
        )).map(module => {
          const file = module.file;
          if (this.isTestFilePath(file)) {
            relatedPaths.add(file);
          }
          visitedModules.add(file);
          return module.file;
        }));
      }
      return relatedPaths;
    };

    if (!changedPaths.size) {
      return Promise.resolve([]);
    }

    const relatedPaths = new Set();
    return this._hasteMap.build().then(data => {
      const changed = new Set();
      for (const path of changedPaths) {
        if (fileExists(path)) {
          const module = data.files[path];
          if (module) {
            changed.add(path);
            if (this.isTestFilePath(path)) {
              relatedPaths.add(path);
            }
          }
        }
      }

      const config = this._config;
      const platform = config.haste.defaultPlatform;
      const extensions = config.moduleFileExtensions.map(ext => '.' + ext);
      const moduleMap = [];
      for (const file in data.files) {
        const fileData = data.files[file];
        const dependencies = fileData[H.DEPENDENCIES]
          .map(dep => {
            const map = data.map[dep];
            if (data.map[dep]) {
              const module = map[platform] || map[H.GENERIC_PLATFORM];
              return module && module[H.PATH];
            } else if (!this._opts.skipNodeResolution) {
              return resolveNodeModule(dep, path.dirname(file), extensions);
            }
            return null;
          })
          .filter(dep => !!dep);

        moduleMap.push({file, dependencies});
      }
      return Array.from(collectChangedModules(
        relatedPaths,
        moduleMap,
        changed
      ));
    });
  }

  promiseTestPathsMatching(pattern) {
    if (pattern && !(pattern instanceof RegExp)) {
      const maybeFile = path.resolve(process.cwd(), pattern);
      if (fileExists(maybeFile)) {
        return Promise.resolve(
          [pattern].filter(this.isTestFilePath.bind(this))
        );
      }
    }

    const paths = this._getAllTestPaths();
    return pattern
      ? paths.then(list => list.filter(path => new RegExp(pattern).test(path)))
      : paths;
  }

  _getTestPerformanceCachePath() {
    const config = this._config;
    return getCacheFilePath(config.cacheDirectory, 'perf-cache-' + config.name);
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
      .then(results => this._cacheTestResults(results).then(() => results));
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
        .then(() => this._hasteMap.build())
        .then(moduleMap => new Test(path, this._config, moduleMap).run())
        .then(result => onTestResult(path, result))
        .catch(err => onRunFailure(path, err)),
      Promise.resolve()
    );
  }

  _createParallelTestRun(testPaths, onTestResult, onRunFailure) {
    const config = this._config;
    return this._hasteMap.build()
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
