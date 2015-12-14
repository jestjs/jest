/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('graceful-fs');
const os = require('os');
const path = require('path');
const assign = require('object-assign');
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

/**
 * A class that takes a project's test config and provides various utilities for
 * executing its tests.
 *
 * @param config The jest configuration
 * @param options See DEFAULT_OPTIONS for descriptions on the various options
 *                and their defaults.
 */
class TestRunner {

  constructor(config, options) {
    this._config = config;
    this._configDeps = null;
    this._moduleLoaderResourceMap = null;
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

    this._opts = assign({}, DEFAULT_OPTIONS, options);
  }

  _constructModuleLoader(environment, customCfg) {
    const config = customCfg || this._config;
    const ModuleLoader = this._loadConfigDependencies().ModuleLoader;
    return this._getModuleLoaderResourceMap().then(
      resourceMap => new ModuleLoader(config, environment, resourceMap)
    );
  }

  _getModuleLoaderResourceMap() {
    const ModuleLoader = this._loadConfigDependencies().ModuleLoader;
    if (this._moduleLoaderResourceMap === null) {
      if (this._opts.useCachedModuleLoaderResourceMap) {
        this._moduleLoaderResourceMap =
          ModuleLoader.loadResourceMapFromCacheFile(this._config, this._opts);
      } else {
        this._moduleLoaderResourceMap =
          ModuleLoader.loadResourceMap(this._config, this._opts);
      }
    }
    return this._moduleLoaderResourceMap;
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

  _loadConfigDependencies() {
    const config = this._config;
    if (this._configDeps === null) {
      this._configDeps = {
        ModuleLoader: require(config.moduleLoader),
        testEnvironment: require(config.testEnvironment),
        testRunner: require(config.testRunner).bind(null),
      };
    }
    return this._configDeps;
  }

  promiseTestPathsRelatedTo(paths) {
    return this._constructModuleLoader()
      .then(moduleLoader => {
        const relatedPaths = [];
        const discoveredModules = {};

        // If a path to a test file is given, make sure we consider that test as
        // related to itself. Non-tests will be filtered at the end.
        paths.forEach(path => {
          discoveredModules[path] = true;
          if (this._isTestFilePath(path) && fs.existsSync(path)) {
            relatedPaths.push(path);
          }
        });

        const modulesToSearch = [].concat(paths);
        while (modulesToSearch.length > 0) {
          const modulePath = modulesToSearch.shift();
          const depPaths = moduleLoader.getDependentsFromPath(modulePath);

          depPaths.forEach(depPath => {
            if (!discoveredModules.hasOwnProperty(depPath)) {
              discoveredModules[depPath] = true;
              modulesToSearch.push(depPath);
              if (this._isTestFilePath(depPath) && fs.existsSync(depPath)) {
                relatedPaths.push(depPath);
              }
            }
          });
        }
        return relatedPaths;
      });
  }

  promiseTestPathsMatching(pathPattern) {
    return this._getModuleLoaderResourceMap()
      .then(resourceMap => {
        const matchingPaths = [];
        const resourcePathMap = resourceMap.resourcePathMap;
        for (const i in resourcePathMap) {
          // Sometimes the loader finds a path with no resource. This typically
          // happens if a file is recently deleted.
          if (!resourcePathMap[i]) {
            continue;
          }

          const pathStr = resourcePathMap[i].path;
          if (
            this._isTestFilePath(pathStr) &&
            pathPattern.test(pathStr)
          ) {
            matchingPaths.push(pathStr);
          }
        }
        return matchingPaths;
      });
  }

  /**
   * Run the given single test file path.
   * This just contains logic for running a single test given it's file path.
   *
   * @param {String} testFilePath
   * @return {Promise<Object>} Results of the test
   */
  runTest(testFilePath) {
    // Shallow copying lets us adjust the config object locally without
    // worrying about the external consequences of changing the config object
    // for needs that are local to this particular function call
    const config = assign({}, this._config);
    const configDeps = this._loadConfigDependencies();

    const env = new configDeps.testEnvironment(config);
    const testRunner = configDeps.testRunner;

    // Intercept console logs to colorize.
    env.global.console = new Console(
      this._config.useStderr ? process.stderr : process.stdout,
      process.stderr
    );

    // Pass the testFilePath into the runner, so it can be used to e.g.
    // configure test reporter output.
    env.testFilePath = testFilePath;
    return this._constructModuleLoader(env, config).then(moduleLoader => {
      // This is a kind of janky way to ensure that we only collect coverage
      // information on modules that are immediate dependencies of the
      // test file.
      //
      // Collecting coverage info on more than that is often not useful as
      // *usually*, when one is looking for coverage info, one is only looking
      // for coverage info on the files under test. Since a test file is just a
      // regular old module that can depend on whatever other modules it likes,
      // it's usually pretty hard to tell which of those dependencies is/are the
      // "module(s)" under test.
      //
      // I'm not super happy with having to inject stuff into the config object
      // mid-stream here, but it gets the job done.
      if (config.collectCoverage && !config.collectCoverageOnlyFrom) {
        config.collectCoverageOnlyFrom = {};
        moduleLoader.getDependenciesFromPath(testFilePath)
          // Skip over built-in (non-absolute paths) and node modules
          .filter(p => path.isAbsolute(p) && !(/node_modules/.test(p)))
          .forEach(p => config.collectCoverageOnlyFrom[p] = true);
      }

      if (config.setupEnvScriptFile) {
        moduleLoader.requireModule(null, config.setupEnvScriptFile);
      }

      const testExecStats = {start: Date.now()};
      return testRunner(config, env, moduleLoader, testFilePath)
        .then(result => {
          testExecStats.end = Date.now();

          result.perfStats = testExecStats;
          result.testFilePath = testFilePath;
          result.coverage =
            config.collectCoverage
            ? moduleLoader.getAllCoverageInfo()
            : {};

          return result;
        });
    }).then(
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
    return path.join(
      this._config.cacheDirectory,
      'perf-cache-' + this._config.name
    );
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

  /**
   * Run all given test paths.
   *
   * @param {Array<String>} testPaths Array of paths to test files
   * @param {Object} reporter Collection of callbacks called on test events
   * @return {Promise<Object>} Fulfilled with information about test run:
   *   success: true if all tests passed
   *   runTime: elapsed time in seconds to run all tests
   *   numTotalTestSuites: total number of test suites considered
   *   numPassedTestSuites: number of test suites run and passed
   *   numFailedTestSuites: number of test suites run and failed
   *   numRuntimeErrorTestSuites: number of test suites failed to run
   *   numTotalTests: total number of tests executed
   *   numPassedTests: number of tests run and passed
   *   numFailedTests: number of tests run and failed
   *   testResults: the jest result info for all tests run
   */
  runTests(testPaths, reporter) {
    const config = this._config;
    if (!reporter) {
      const TestReporter = require(config.testReporter);
      if (config.useStderr) {
        /* eslint-disable fb-www/object-create-only-one-param */
        reporter = new TestReporter(Object.create(
          process,
          {stdout: {value: process.stderr}}
        ));
        /* eslint-enable fb-www/object-create-only-one-param */
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
        suites: {},
        tests: {},
        testResults: {},
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

      // We allow for a couple of transient errors. Say something to do
      // with loading/serialization of the resourcemap (which I've seen
      // happen).
      maxRetries: 2,
      maxConcurrentWorkers: this._opts.maxWorkers,
    }, TEST_WORKER_PATH);

    const runTest = promisify(farm);

    return this._getModuleLoaderResourceMap()
      .then(() => Promise.all(testPaths.map(
        testFilePath => runTest({config: this._config, testFilePath})
          .then(testResult => onTestResult(testFilePath, testResult))
          .catch(err => {
            onRunFailure(testFilePath, err);

            if (err.type === 'ProcessTerminatedError') {
              // Initialization error or some other uncaught error
              console.error(
                'A worker process has quit unexpectedly! ' +
                'Most likely this an initialization error.'
              );
              process.exit(1);
            }
          })
      ))).then(() => workerFarm.end(farm));
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
