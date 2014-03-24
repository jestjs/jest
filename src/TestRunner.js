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
function TestRunner(config, options) {
  this._config = config;
  this._configDeps = null;
  this._opts = Object.create(DEFAULT_OPTIONS);
  this._resourceMapPromise = null;

  if (options) {
    for (var key in options) {
      this._opts[key] = options[key];
    }
  }
}

TestRunner.prototype._constructModuleLoader = function(environment, customCfg) {
  var config = customCfg || this._config;
  var ModuleLoader = this._loadConfigDependencies().ModuleLoader;
  if (this._resourceMapPromise === null) {
    this._resourceMapPromise = ModuleLoader.loadResourceMap(this._config);
  }
  return this._resourceMapPromise.then(function(resourceMap) {
    return new ModuleLoader(config, environment, resourceMap);
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
 * Given a list of paths to modules or tests, find all tests that are related to
 * any of those paths. For a test to be considered "related" to a path, the test
 * must depend on that path (either directly, or indirectly through one of its
 * direct dependencies).
 *
 * @param {Array<String>} paths A list of path strings to find related tests for
 * @return {Promise<Array<String>>} Fulfilled with a list of testPaths once the
 *                                  search has completed.
 */
TestRunner.prototype.findTestsRelatedTo = function(paths) {
  var config = this._config;
  return this._constructModuleLoader().then(function(moduleLoader) {
    var discoveredModules = {};
    var modulesToSearch = [].concat(paths);
    while (modulesToSearch.length > 0) {
      var modulePath = modulesToSearch.shift();
      var depPaths = moduleLoader.getDependentsFromPath(modulePath);
      depPaths.forEach(function(depPath) {
        if (!discoveredModules.hasOwnProperty(depPath)) {
          discoveredModules[depPath] = true;
          modulesToSearch.push(depPath);
        }
      });
    }

    // TODO: This is copypasta from this.findTestPathsMatching()
    var testPathIgnorePattern =
      config.testPathIgnores
      ? new RegExp(config.testPathIgnores.join('|'))
      : null;

    return Object.keys(discoveredModules).filter(function(path) {
      // TODO: This is copypasta from this.findTestPathsMatching()
      return (
        NODE_HASTE_TEST_PATH_RE.test(path)
        && !HIDDEN_FILE_RE.test(path)
        && (!testPathIgnorePattern || !testPathIgnorePattern.test(path))
      );
    });
  });
};

/**
 * Given a path pattern, find the absolute paths for all tests that match the
 * pattern.
 *
 * @param {RegExp} pathPattern
 * @param {Function} onTestFound Callback called immediately when a test is
 *                               found.
 *
 *                               Ideally this function should return a
 *                               stream, but I don't personally understand all
 *                               the variations of "node streams" that exist in
 *                               the world (and their various compatibilities
 *                               with various node versions), so I've opted to
 *                               forgo that for now.
 * @return {Promise<Array<String>>} Fulfilled with a list of testPaths once the
 *                                  search has completed.
 */
TestRunner.prototype.findTestPathsMatching = function(
  pathPattern, onTestFound) {

  var config = this._config;
  var deferred = Q.defer();

  var testPathIgnorePattern =
    config.testPathIgnores
    ? new RegExp(config.testPathIgnores.join('|'))
    : null;

  var foundPaths = [];
  function _onMatcherMatch(pathStr) {
    foundPaths.push(pathStr);
    try {
      onTestFound(pathStr);
    } catch (e) {
      deferred.reject(e);
    }
  }

  var numMatchers = config.testPathDirs.length;
  function _onMatcherEnd() {
    numMatchers--;
    if (numMatchers === 0) {
      deferred.resolve(foundPaths);
    }
  }

  function _onMatcherError(err) {
    deferred.reject(err);
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
    finder.on('error', _onMatcherError);
    finder.on('match', _onMatcherMatch);
    finder.on('complete', _onMatcherEnd);
    finder.startSearch();
  });

  return deferred.promise;
};

/**
 * Run the given single test file path.
 * This just contains logic for running a single test given it's file path.
 *
 * @param {String} testFilePath
 * @return {Promise<Object>} Results of the test
 */
TestRunner.prototype.runTest = function(testFilePath) {
  // Using Object.create() lets us adjust the config object locally without
  // worrying about the external consequences of changing the config object for
  // needs that are local to this particular function call
  var config = Object.create(this._config);
  var configDeps = this._loadConfigDependencies();

  var env = configDeps.environmentBuilder();
  var testRunner = configDeps.testRunner;

  // Capture and serialize console.{log|warning|error}s so they can be passed
  // around (such as through some channel back to a parent process)
  var consoleMessages = [];
  env.global.console = {
    error: function() {
      consoleMessages.push(_serializeConsoleArguments('error', arguments));
    },

    group: function() {
      // TODO
    },

    groupCollapsed: function() {
      // TODO
    },

    groupEnd: function() {
      // TODO
    },

    log: function() {
      consoleMessages.push(_serializeConsoleArguments('log', arguments));
    },

    table: function() {
      // TODO
    },

    warn: function() {
      consoleMessages.push(_serializeConsoleArguments('warn', arguments));
    }
  };

  return this._constructModuleLoader(env, config).then(function(moduleLoader) {
    // This is a kind of janky way to ensure that we only collect coverage
    // information on modules that are immediate dependencies of the test file.
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
      moduleLoader.getDependenciesFromPath(testFilePath).filter(function(depPath) {
        // Skip over built-in and node modules
        return /^\//.test(depPath);
      }).forEach(function(depPath) {
        config.collectCoverageOnlyFrom[depPath] = true;
      });
    }

    if (config.setupEnvScriptFile) {
      utils.runContentWithLocalBindings(
        env.runSourceText,
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
    return testRunner(config, env, moduleLoader, testFilePath)
      .then(function(results) {
        testExecStats.end = Date.now();
        results.consoleMessages = consoleMessages;
        results.stats = testExecStats;
        results.testFilePath = testFilePath;
        results.coverage =
          config.collectCoverage
          ? moduleLoader.getAllCoverageInfo()
          : {};
        return results;
      });
  });
};

/**
 * Run all tests (in parallel) matching the given path pattern RegExp.
 * Uses a worker pool of child processes to run tests in parallel.
 *
 * @param {RegExp} pathPattern A RegExp object that a given test path must match
 *                             in order to be run.
 * @return {Promise<Object>} Fulfilled when all tests have finished running
 */
TestRunner.prototype.runAllMatchingParallel = function(pathPattern) {
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

  var failedTests = 0;
  var self = this;
  function _onTestFound(pathStr) {
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

  var foundTestPaths = this.findTestPathsMatching(pathPattern, _onTestFound);

  return foundTestPaths.then(function(allMatchingTestPaths) {
    return workerPool.shutDown().then(function() {
      var endTime = Date.now();
      return {
        numFailedTests: failedTests,
        numTotalTests: allMatchingTestPaths.length,
        startTime: startTime,
        endTime: endTime
      };
    });
  });
};

/**
 * Run all tests (serially) matching the given path pattern RegExp.
 * This runs all tests serially and in the current process (i.e. no child
 * processes). This is mostly useful for debugging issues with Jest or rare,
 * complicated issues with some tests.
 *
 * @param {RegExp} pathPattern A RegExp object that a given test path must match
 *                             in order to be run.
 * @return {Promise<Object>} Fulfilled when all tests have finished running
 */
TestRunner.prototype.runAllMatchingInBand = function(pathPattern) {
  var startTime = Date.now();
  var config = this._config;

  var failedTests = 0;
  var lastTest = Q();
  var self = this;
  function _onTestFound(pathStr) {
    var runThisTest = self.runTest.bind(self, pathStr);
    lastTest = lastTest.then(runThisTest).then(function(results) {
      var allTestsPassed = self._opts.testResultsHandler(config, results);
      if (!allTestsPassed) {
        failedTests++;
      }
    }, function(err) {
      failedTests++;
      throw err;
    });
  }

  var foundTestPaths = this.findTestPathsMatching(pathPattern, _onTestFound);

  return foundTestPaths.then(function(allMatchingTestPaths) {
    return lastTest.then(function() {
      var endTime = Date.now();
      return {
        numFailedTests: failedTests,
        numTotalTests: allMatchingTestPaths.length,
        startTime: startTime,
        endTime: endTime
      };
    });
  });
};

module.exports = TestRunner;
