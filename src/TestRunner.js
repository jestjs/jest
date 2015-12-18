/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

 /* eslint-disable fb-www/object-create-only-one-param */
'use strict';

const fs = require('graceful-fs');
const os = require('os');
const path = require('path');
const utils = require('./lib/utils');
const workerFarm = require('worker-farm');
const Console = require('./Console');
const promisify = require('./lib/promisify');

const TEST_WORKER_PATH = require.resolve('./TestWorker');

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
    this._resolver = new Resolver(config);

    // Maximum memory usage if `logHeapUsage` is enabled.
    this._maxMemoryUsage = 0;
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
    return this._resolver.matchFilesByPattern(this._config.testDirectoryName);
  }

  _isTestFilePath(filePath) {
    // get filePath into OS-appropriate format before testing patterns
    filePath = path.normalize(filePath);
    const testPathIgnorePattern =
      this._config.testPathIgnorePatterns.length
      ? new RegExp(this._config.testPathIgnorePatterns.join('|'))
      : null;

    return (
      this._nodeHasteTestRegExp.test(filePath)
      && !HIDDEN_FILE_RE.test(filePath)
      && (!testPathIgnorePattern || !testPathIgnorePattern.test(filePath))
      && this._testPathDirsRegExp.test(filePath)
    );
  }

  promiseTestPathsRelatedTo(changedPaths) {
    return this._getAllTestPaths()
      .then(paths => {
        const allTests = Object.create(null);
        return Promise.all(
          paths.map(path => this._resolver.getDependencies(path)
            .then(deps => allTests[path] = deps)
          )
        ).then(() => {
          const relatedPaths = new Set();
          for (const path in allTests) {
            if (this._isTestFilePath(path)) {
              for (const resourcePath in allTests[path].resources) {
                if (changedPaths.has(resourcePath)) {
                  relatedPaths.add(path);
                }
              }
            }
          }
          return Array.from(relatedPaths);
        });
      });
  }

  promiseTestPathsMatching(pathPattern) {
    return this._getAllTestPaths()
      .then(testPaths => testPaths.filter(
        path => this._isTestFilePath(path) && pathPattern.test(path)
      ));
  }

  runTest(path) {
    const config = this._config;
    const TestEnvironment = require(config.testEnvironment);
    const TestRunner = require(config.testRunner);
    const ModuleLoader = require(config.moduleLoader);
    const paths = [path];
    if (config.setupEnvScriptFile) {
      paths.push(config.setupEnvScriptFile);
    }
    if (config.setupTestFrameworkScriptFile) {
      paths.push(config.setupTestFrameworkScriptFile);
    }

    const env = new TestEnvironment(config);
    env.global.console = new Console(
      this._config.useStderr ? process.stderr : process.stdout,
      process.stderr
    );
    env.testFilePath = path;
    return Promise.all(paths.map(p => this._resolver.getDependencies(p)))
      .then(moduleMaps => {
        const moduleMap = Object.create(null);
        moduleMap.mocks = Object.create(null);
        moduleMap.resolvedModules = Object.create(null);
        moduleMap.resources = Object.create(null);
        moduleMaps.forEach(map => {
          Object.assign(moduleMap.mocks, map.mocks);
          Object.assign(moduleMap.resolvedModules, map.resolvedModules);
          Object.assign(moduleMap.resources, map.resources);
        });

        const moduleLoader = new ModuleLoader(config, env, moduleMap);
        if (config.setupEnvScriptFile) {
          moduleLoader.requireModule(null, config.setupEnvScriptFile);
        }
        const start = Date.now();
        return TestRunner(config, env, moduleLoader, path)
          .then(result => {
            result.perfStats = {start, end: Date.now()};
            result.testFilePath = path;
            result.coverage = moduleLoader.getAllCoverageInfo();
            return result;
          });
      })
      .then(
        result => Promise.resolve().then(() => {
          env.dispose();
          if (config.logHeapUsage) {
            this._addMemoryUsage(result);
          }
          return result;
        }),
        err => Promise.resolve().then(() => {
          env.dispose();
          throw err;
        })
      );
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
    const performanceCacheFile = this._getTestPerformanceCachePath();
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
    return new Promise(resolve =>
      fs.writeFile(
        performanceCacheFile,
        JSON.stringify(testPerformanceCache),
        () => resolve(aggregatedResults)
      )
    );
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
      .then(this._cacheTestResults.bind(this));
  }

  _createTestRun(testPaths, onTestResult, onRunFailure) {
    if (this._opts.runInBand || testPaths.length <= 1) {
      return this._createInBandTestRun(testPaths, onTestResult, onRunFailure);
    } else {
      return this._createParallelTestRun(testPaths, onTestResult, onRunFailure);
    }
  }

  _createInBandTestRun(testPaths, onTestResult, onRunFailure) {
    let testSequence = Promise.resolve();
    testPaths.forEach(testPath =>
      testSequence = testSequence
        .then(this.runTest.bind(this, testPath))
        .then(testResult => onTestResult(testPath, testResult))
        .catch(err => onRunFailure(testPath, err))
    );
    return testSequence;
  }

  _createParallelTestRun(testPaths, onTestResult, onRunFailure) {
    const farm = workerFarm({
      maxConcurrentCallsPerWorker: 1,
      maxRetries: 2, // Allow for a couple of transient errors.
      maxConcurrentWorkers: this._opts.maxWorkers,
    }, TEST_WORKER_PATH);

    const runTest = promisify(farm);
    return Promise.all(testPaths.map(
      path => runTest({config: this._config, path})
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

  _addMemoryUsage(result) {
    if (global.gc) {
      global.gc();
    }
    const memoryUsage = process.memoryUsage().heapUsed;
    this._maxMemoryUsage = Math.max(this._maxMemoryUsage, memoryUsage);
    result.maxMemoryUsage = this._maxMemoryUsage;
    result.memoryUsage = memoryUsage;
  }
}

module.exports = TestRunner;
