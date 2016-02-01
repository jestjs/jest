/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

 /* eslint-disable fb-www/object-create-only-one-param */
'use strict';

const Test = require('./Test');

const fs = require('graceful-fs');
const os = require('os');
const path = require('path');
const utils = require('./lib/utils');
const workerFarm = require('worker-farm');
const promisify = require('./lib/promisify');

const TEST_WORKER_PATH = require.resolve('./TestWorker');

const mergeModuleMap = (a, b) => {
  Object.assign(a.mocks, b.mocks);
  Object.assign(a.resolvedModules, b.resolvedModules);
  Object.assign(a.resources, b.resources);
  return a;
};

const DEFAULT_OPTIONS = {

  /**
   * When true, runs all tests serially in the current process, rather than
   * creating a worker pool of child processes.
   *
   * This can be useful for debugging, or when the environment limits to a
   * single process.
   */
  runInBand: false,

  /**
   * The maximum number of workers to run tests concurrently with.
   *
   * It's probably good to keep this at something close to the number of cores
   * on the machine that's running the test.
   */
  maxWorkers: Math.max(os.cpus().length, 1),

  /**
   * The path to the executable node binary.
   *
   * This is used in the process of booting each of the workers.
   */
  nodePath: process.execPath,

  /**
   * The args to be passed to the node binary executable.
   *
   * This is used in the process of booting each of the workers.
   * Passing --debug off to child processes can screw with socket connections
   * of the parent process.
   */
  nodeArgv: process.execArgv.filter(arg => arg.indexOf('--debug') == -1),
};

const HIDDEN_FILE_RE = /\/\.[^\/]*$/;
function optionPathToRegex(p) {
  return utils.escapeStrForRegex(p.replace(/\//g, path.sep));
}

class TestRunner {

  constructor(config, options) {
    this._opts = Object.assign({}, DEFAULT_OPTIONS, options);
    this._config = Object.freeze(config);
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

  promiseTestPathsRelatedTo(changedPaths) {
    const relatedPaths = new Set();
    const collect = (moduleMap, changed) => {
      const visitedModules = new Set();
      let isInitial = true;
      while (changed.size) {
        changed = new Set(moduleMap.filter(item => {
          const module = item.module;
          if (visitedModules.has(module.path)) {
            return false;
          }
          return item.dependencies.some(dep => dep && changed.has(dep.path));
        }).map(item => {
          const path = item.module.path;
          if (this._isTestFilePath(path)) {
            relatedPaths.add(path);
          }
          return path;
        }));

        if (!isInitial) {
          for (const path of changed) {
            visitedModules.add(path);
          }
        }
        isInitial = false;
      }
      return relatedPaths;
    };

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
            module: allModules[path],
            dependencies: response.dependencies,
          }))
      )).then(moduleMap => Array.from(collect(moduleMap, changed)));
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
    let testPerformanceCache = this._testPerformanceCache;
    if (!testPerformanceCache) {
      testPerformanceCache = this._testPerformanceCache = {};
    }
    aggregatedResults.testResults.forEach(test => {
      const perf = test && test.perfStats;
      if (perf && perf.end && perf.start) {
        testPerformanceCache[test.testFilePath] = perf.end - perf.start;
      }
    });
    const cache = JSON.stringify(testPerformanceCache);
    return new Promise(resolve => fs.writeFile(cacheFile, cache, resolve));
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
      testResults: [],
      postSuiteHeaders: [],
    };

    reporter.onRunStart && reporter.onRunStart(config, aggregatedResults);

    const onTestResult = (testPath, testResult) => {
      aggregatedResults.testResults.push(testResult);
      aggregatedResults.numTotalTests +=
        testResult.numPassingTests +
        testResult.numFailingTests;
      aggregatedResults.numFailedTests += testResult.numFailingTests;
      aggregatedResults.numPassedTests += testResult.numPassingTests;
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
    const config = this._config;
    let testSequence = Promise.resolve();
    testPaths.forEach(path =>
      testSequence = testSequence
        .then(() => this._resolveDependencies(path))
        .then(moduleMap => new Test(path, moduleMap, config).run())
        .then(result => onTestResult(path, result))
        .catch(err => onRunFailure(path, err))
    );
    return testSequence;
  }

  _createParallelTestRun(testPaths, onTestResult, onRunFailure) {
    const config = this._config;
    const farm = workerFarm({
      autoStart: true,
      maxConcurrentCallsPerWorker: 1,
      maxRetries: 2, // Allow for a couple of transient errors.
      maxConcurrentWorkers: this._opts.maxWorkers,
    }, TEST_WORKER_PATH);
    const runTest = promisify(farm);

    return Promise.all(testPaths.map(
      path => this._resolveDependencies(path)
        .then(moduleMap => runTest({path, moduleMap, config}))
        .then(testResult => onTestResult(path, testResult))
        .catch(err => {
          onRunFailure(path, err);

          if (err.type === 'ProcessTerminatedError') {
            // Initialization error or some other uncaught error
            console.error(
              'A worker process has quit unexpectedly! ' +
              'Most likely this an initialization error.'
            );
            process.exit(1);
          }
        })
    )).then(() => workerFarm.end(farm));
  }

  _resolveSetupFiles() {
    if (this._setupFilePromise) {
      return this._setupFilePromise;
    }

    const config = this._config;
    const paths = [];
    const moduleMap = {
      mocks: Object.create(null),
      resolvedModules: Object.create(null),
      resources: Object.create(null),
    };
    if (config.setupEnvScriptFile) {
      paths.push(config.setupEnvScriptFile);
    }
    if (config.setupTestFrameworkScriptFile) {
      paths.push(config.setupTestFrameworkScriptFile);
    }
    if (paths.length) {
      return this._setupFilePromise = Promise.all(
        paths.map(p => this._resolver.getDependencies(p))
      ).then(moduleMaps => {
        moduleMaps.forEach(map => mergeModuleMap(moduleMap, map));
        return moduleMap;
      });
    } else {
      return this._setupFilePromise = Promise.resolve(moduleMap);
    }
  }

  _resolveDependencies(path) {
    return Promise.all([
      this._resolveSetupFiles(),
      this._resolver.getDependencies(path),
    ]).then(
      moduleMaps => mergeModuleMap(moduleMaps[1], moduleMaps[0])
    );
  }

}

module.exports = TestRunner;
