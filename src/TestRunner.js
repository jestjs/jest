"use strict";

var colors = require('./lib/colors');
var FileFinder = require('node-find-files');
var os = require('os');
var path = require('path');
var Q = require('q');
var stream = require('stream');
var utils = require('./lib/utils');
var WorkerPool = require('node-worker-pool');

var colorize = colors.colorize;

var TEST_WORKER_PATH = require.resolve('./TestWorker');

var DEFAULT_OPTIONS = {
  /**
   * The maximum number of workers to run tests concurrently with.
   *
   * It's probably good to keep this at something close to the number of cores
   * on the machine that's running the test.
   */
  maxWorkers: os.cpus().length - 1,

  /**
   * The path to the executable node binary.
   *
   * This is used in the process of booting each of the workers.
   */
  nodePath: process.execPath,

  /**
   * The args to be passed to the node binary executable.
   *
   * this is used in the process of booting each of the workers.
   */
  nodeArgv: process.execArgv.filter(function(arg) {
    // Passing --debug off to child processes can screw with socket connections
    // of the parent process.
    return arg !== '--debug';
  }),

  /**
   * Function for handling (usually printing) the results of a given test.
   * This function will be called once for each test when the test is complete,
   * and with the following arguments:
   *
   * @param {object} config The config object supplied to the TestRunner
   * @param {object} testResult The results of the test
   *
   * TODO: Document + formalized the format of the results object
   */
  testResultsHandler: require('./defaultTestResultHandler')
};

var HIDDEN_FILE_RE = /\/\.[^\/]*$/;
var NODE_HASTE_TEST_PATH_RE = /\/__tests__\/.*\.js$/;

function _serializeConsoleArguments(type, args) {
  return {
    type: type,
    args: Array.prototype.map.call(
      args,
      utils.serializeConsoleArgValue
    )
  };
}

/**
 * A class that takes a config and a test-path search pattern, finds all the
 * tests that match the pattern, runs them in the worker pool, and prints the
 * results to stdout.
 *
 * @param jestConfig The config object passed to each worker
 * @param options See DEFAULT_OPTIONS for descriptions on the various options
 *                and their defaults.
 */
function TestRunner(jestConfig, options) {
  this._config = jestConfig;
  this._configDeps = null;
  this._opts = Object.create(DEFAULT_OPTIONS);
  this._resourceMapPromise = null;

  if (options) {
    for (var key in options) {
      this._opts[key] = options[key];
    }
  }
}

TestRunner.prototype._constructModuleLoader = function(environment) {
  var config = this._config;
  var ModuleLoader = this._loadConfigDependencies().ModuleLoader;
  if (this._resourceMapPromise === null) {
    this._resourceMapPromise = ModuleLoader.loadResourceMap(this._config);
  }
  return this._resourceMapPromise.then(function(resourceMap) {
    return new ModuleLoader(config, environment, resourceMap);
  });
};

TestRunner.prototype._findTestFilePaths = function(
    config, pathPattern, onFind, onComplete) {

  var testPathIgnorePattern =
    config.testPathIgnores
    ? new RegExp(config.testPathIgnores.join('|'))
    : null;

  var numMatchers = config.testPathDirs.length;
  function _onMatcherEnd() {
    numMatchers--;
    if (numMatchers === 0) {
      onComplete();
    }
  }

  function _onMatcherMatch(pathStr) {
    onFind(pathStr);
  }

  config.testPathDirs.forEach(function(scanDir) {
    var finder = new FileFinder({
      rootFolder: scanDir,
      filterFunction: function(pathStr, stat) {
        return (
          NODE_HASTE_TEST_PATH_RE.test(pathStr)
          && !HIDDEN_FILE_RE.test(pathStr)
          && pathPattern.test(pathStr)
          && (!testPathIgnorePattern || !testPathIgnorePattern.test(pathStr))
        );
      }
    });
    finder.on('match', _onMatcherMatch);
    finder.on('complete', _onMatcherEnd);
    finder.startSearch();
  });
};

TestRunner.prototype._loadConfigDependencies = function() {
  var config = this._config;
  if (this._configDeps === null) {
    this._configDeps = {
      ModuleLoader: require(config.moduleLoader),
      environmentBuilder: require(config.environmentBuilder).bind(null),
      testRunner: require(config.testRunner).bind(null)
    };
  }
  return this._configDeps;
};

/**
 * Run the given single test file path.
 * This just contains logic for running a single test given it's file path.
 *
 * @param {string} testFilePath
 * @return {Promise} Results of the test
 */
TestRunner.prototype.runTest = function(testFilePath) {
  var config = this._config;
  var configDeps = this._loadConfigDependencies();

  var environment = configDeps.environmentBuilder();
  var testRunner = configDeps.testRunner;

  // Capture and serialize console.{log|warning|error}s so they can be passed
  // around (such as through some channel back to a parent process)
  var consoleMessages = [];
  environment.global.console = {
    error: function() {
      consoleMessages.push(_serializeConsoleArguments('error', arguments));
    },

    log: function() {
      consoleMessages.push(_serializeConsoleArguments('log', arguments));
    },

    warn: function() {
      consoleMessages.push(_serializeConsoleArguments('warn', arguments));
    }
  };

  return this._constructModuleLoader(environment).then(function(moduleLoader) {
    if (config.setupEnvScriptFile) {
      utils.runContentWithLocalBindings(
        environment.runSourceText,
        utils.readAndPreprocessFileContent(config.setupEnvScriptFile, config),
        config.setupEnvScriptFile,
        {
          __dirname: path.dirname(config.setupEnvScriptFile),
          __filename: config.setupEnvScriptFile,
          require: moduleLoader.constructBoundRequire(
            config.setupEnvScriptFile
          )
        }
      );
    }

    var testExecStats = {start: Date.now()};
    return testRunner(config, environment, moduleLoader, testFilePath)
      .then(function(results) {
        testExecStats.end = Date.now();
        results.consoleMessages = consoleMessages;
        results.stats = testExecStats;
        results.testFilePath = testFilePath;
        results.coverage =
          config.collectCoverage
          ? moduleLoader.getAllCoverageInfo()
          : [];
        return results;
      });
  });
};

/**
 * Run all tests (in parallel) matching the given path pattern RegExp.
 * Uses a worker pool of child processes to run tests in parallel.
 *
 * @param pathPattern A RegExp object that a given test path must match in
 *                    order to be run.
 * @return promise Fulfilled when all tests have finished running
 */
TestRunner.prototype.runAllParallel = function(pathPattern) {
  var startTime = Date.now();
  var config = this._config;

  var workerPool = new WorkerPool(
    this._opts.maxWorkers,
    this._opts.nodePath,
    this._opts.nodeArgv.concat([
      '--harmony',
      TEST_WORKER_PATH,
      '--config=' + JSON.stringify(config)
    ])
  );

  var deferred = Q.defer();
  var failedTests = 0;
  var numTests = 0;
  var self = this;

  function _onTestFound(pathStr) {
    numTests++;
    workerPool.sendMessage({testFilePath: pathStr}).done(function(results) {
      var allTestsPassed = self._opts.testResultsHandler(config, results);
      if (!allTestsPassed) failedTests++
    }, function(errMsg) {
      failedTests++;
      self._opts.testResultsHandler(config, {
        testFilePath: pathStr,
        testExecError: errMsg,
        suites: {},
        tests: {},
        consoleMessages: []
      });
    });
  }

  function _onSearchComplete() {
    workerPool.shutDown().done(function() {
      var endTime = Date.now();
      deferred.resolve({
        numFailedTests: failedTests,
        numTotalTests: numTests,
        startTime: startTime,
        endTime: endTime
      });
    }, deferred.reject);
  }

  this._findTestFilePaths(
    config,
    pathPattern,
    _onTestFound,
    _onSearchComplete
  );

  return deferred.promise;
};

/**
 * Run all tests (serially) matching the given path pattern RegExp.
 * This runs all tests serially and in the current process (i.e. no child
 * processes). This is mostly useful for debugging issues with Jest or rare,
 * complicated issues with some tests.
 *
 * @param pathPattern A RegExp object that a given test path must match in order
 *                    to be run.
 * @return promise Fulfilled when all tests have finished running
 */
TestRunner.prototype.runAllInBand = function(pathPattern) {
  var startTime = Date.now();
  var config = this._config;

  var deferred = Q.defer();
  var failedTests = 0;
  var numTests = 0;

  var lastTest = Q();
  var rejectDeferred = deferred.reject.bind(deferred);
  var self = this;
  function _onTestFound(pathStr) {
    numTests++;
    lastTest = lastTest.then(function() {
      return self.runTest(pathStr).then(function(results) {
        var allTestsPassed = self._opts.testResultsHandler(config, results);
        if (!allTestsPassed) failedTests++;
      }, function(err) {
        failedTests++;
        throw err;
      });
    }, rejectDeferred);
  }

  function _onSearchComplete() {
    lastTest.then(function() {
      var endTime = Date.now();
      deferred.resolve({
        numFailedTests: failedTests,
        numTotalTests: numTests,
        startTime: startTime,
        endTime: endTime
      });
    }, rejectDeferred);
  }

  this._findTestFilePaths(
    this._config,
    pathPattern,
    _onTestFound.bind(this),
    _onSearchComplete.bind(this)
  );

  return deferred.promise;
};

module.exports = TestRunner;
