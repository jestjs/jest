/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var FileFinder = require('node-find-files');
var fs = require('fs');
var os = require('os');
var path = require('path');
var q = require('q');
var utils = require('./lib/utils');
var WorkerPool = require('node-worker-pool');

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
  })
};

var HIDDEN_FILE_RE = /\/\.[^\/]*$/;

function _serializeConsoleArguments(type, args) {
  return {
    type: type,
    args: Array.prototype.map.call(args, function(arg) {
      return utils.serializeConsoleArgValue(arg);
    })
  };
}

/**
 * A class that takes a project's test config and provides various utilities for
 * executing its tests.
 *
 * @param config The jest configuration
 * @param options See DEFAULT_OPTIONS for descriptions on the various options
 *                and their defaults.
 */
function TestRunner(config, options) {
  this._config = config;
  this._configDeps = null;
  this._moduleLoaderResourceMap = null;
  this._testPathDirsRegExp = new RegExp(
    config.testPathDirs
      .map(function(dir) {
        return utils.escapeStrForRegex(dir);
      })
      .join('|')
  );

  this._nodeHasteTestRegExp = new RegExp(
    '/' + utils.escapeStrForRegex(config.testDirectoryName) + '/' +
    '.*\\.(' +
      config.testFileExtensions.map(function(ext) {
        return utils.escapeStrForRegex(ext);
      })
      .join('|') +
    ')$'
  );
  this._opts = Object.create(DEFAULT_OPTIONS);
  if (options) {
    for (var key in options) {
      this._opts[key] = options[key];
    }
  }
}

TestRunner.prototype._constructModuleLoader = function(environment, customCfg) {
  var config = customCfg || this._config;
  var ModuleLoader = this._loadConfigDependencies().ModuleLoader;
  return this._getModuleLoaderResourceMap().then(function(resourceMap) {
    return new ModuleLoader(config, environment, resourceMap);
  });
};

TestRunner.prototype._getModuleLoaderResourceMap = function() {
  var ModuleLoader = this._loadConfigDependencies().ModuleLoader;
  if (this._moduleLoaderResourceMap === null) {
    if (this._opts.useCachedModuleLoaderResourceMap) {
      this._moduleLoaderResourceMap =
        ModuleLoader.loadResourceMapFromCacheFile(this._config);
    } else {
      this._moduleLoaderResourceMap =
        ModuleLoader.loadResourceMap(this._config);
    }
  }
  return this._moduleLoaderResourceMap;
};

TestRunner.prototype._isTestFilePath = function(filePath) {
  var testPathIgnorePattern =
    this._config.testPathIgnorePatterns
    ? new RegExp(this._config.testPathIgnorePatterns.join('|'))
    : null;

  return (
    this._nodeHasteTestRegExp.test(filePath)
    && !HIDDEN_FILE_RE.test(filePath)
    && (!testPathIgnorePattern || !testPathIgnorePattern.test(filePath))
    && this._testPathDirsRegExp.test(filePath)
  );
};

TestRunner.prototype._loadConfigDependencies = function() {
  var config = this._config;
  if (this._configDeps === null) {
    this._configDeps = {
      ModuleLoader: require(config.moduleLoader),
      testEnvironment: require(config.testEnvironment),
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
  var testRunner = this;
  return this._constructModuleLoader().then(function(moduleLoader) {
    var discoveredModules = {};

    // If a path to a test file is given, make sure we consider that test as
    // related to itself...
    //
    // (If any of the supplied paths aren't tests, it's ok because we filter
    //  non-tests out at the end)
    paths.forEach(function(path) {
      discoveredModules[path] = true;
    });

    var modulesToSearch = [].concat(paths);
    while (modulesToSearch.length > 0) {
      var modulePath = modulesToSearch.shift();
      var depPaths = moduleLoader.getDependentsFromPath(modulePath);

      /* jshint loopfunc:true */
      depPaths.forEach(function(depPath) {
        if (!discoveredModules.hasOwnProperty(depPath)) {
          discoveredModules[depPath] = true;
          modulesToSearch.push(depPath);
        }
      });
    }

    return Object.keys(discoveredModules).filter(function(path) {
      return testRunner._isTestFilePath(path) && fs.existsSync(path);
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
  var deferred = q.defer();

  var foundPaths = [];
  function _onMatcherMatch(pathStr) {
    foundPaths.push(pathStr);
    try {
      onTestFound && onTestFound(pathStr);
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
      filterFunction: function(pathStr) {
        return this._isTestFilePath(pathStr) && pathPattern.test(pathStr);
      }.bind(this)
    });
    finder.on('error', _onMatcherError);
    finder.on('match', _onMatcherMatch);
    finder.on('complete', _onMatcherEnd);
    finder.startSearch();
  }, this);

  return deferred.promise;
};

/**
 * For use by external users of TestRunner as a means of optimization.
 *
 * Imagine the following scenario executing in a child worker process:
 *
 * var runner = new TestRunner(config, {
 *   moduleLoaderResourceMap: serializedResourceMap
 * });
 * someOtherAyncProcess.then(function() {
 *   runner.runTestsParallel();
 * });
 *
 * Here we wouldn't start deserializing the resource map (passed to us from the
 * parent) until runner.runTestsParallel() is called. At the time of this
 * writing, resource map deserialization is slow and a bottleneck on running the
 * first test in a child.
 *
 * So this API gives scenarios such as the one above an optimization path to
 * potentially start deserializing the resource map while we wait on the
 * someOtherAsyncProcess to resolve (rather that doing it after it's resolved).
 */
TestRunner.prototype.preloadResourceMap = function() {
  this._getModuleLoaderResourceMap().done();
};

TestRunner.prototype.preloadConfigDependencies = function() {
  this._loadConfigDependencies();
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

  var env = new configDeps.testEnvironment(config);
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
      moduleLoader.getDependenciesFromPath(testFilePath)
        .filter(function(depPath) {
          // Skip over built-in and node modules
          return /^\//.test(depPath);
        }).forEach(function(depPath) {
          config.collectCoverageOnlyFrom[depPath] = true;
        });
    }

    if (config.setupEnvScriptFile) {
      utils.runContentWithLocalBindings(
        env.runSourceText.bind(env),
        utils.readAndPreprocessFileContent(config.setupEnvScriptFile, config),
        config.setupEnvScriptFile,
        {
          __dirname: path.dirname(config.setupEnvScriptFile),
          __filename: config.setupEnvScriptFile,
          global: env.global,
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

        results.logMessages = consoleMessages;
        results.perfStats = testExecStats;
        results.testFilePath = testFilePath;
        results.coverage =
          config.collectCoverage
          ? moduleLoader.getAllCoverageInfo()
          : {};

        return results;
      });
  }).finally(function() {
    env.dispose();
  });
};

/**
 * Run all given test paths serially (in the current process).
 *
 * This is mostly useful for debugging issues with jest itself, but may also be
 * useful for scenarios where you don't want jest to start up a worker pool of
 * its own.
 *
 * @param {Array<String>} testPaths Array of paths to test files
 * @param {Function} onResult Callback called once for each test result
 * @return {Promise<Object>} Fulfilled with aggregate pass/fail information
 *                           about all tests that were run
 */
TestRunner.prototype.runTestsInBand = function(testPaths, onResult) {
  var config = this._config;

  var aggregatedResults = {
    numFailedTests: 0,
    numTotalTests: testPaths.length,
    startTime: Date.now(),
    endTime: null
  };

  var testSequence = q();
  testPaths.forEach(function(testPath) {
    testSequence = testSequence.then(this.runTest.bind(this, testPath))
      .then(function(testResult) {
        if (testResult.numFailingTests > 0) {
          aggregatedResults.numFailedTests++;
        }
        onResult && onResult(config, testResult);
      })
      .catch(function(err) {
        aggregatedResults.numFailedTests++;
        onResult && onResult(config, {
          testFilePath: testPath,
          testExecError: err,
          suites: {},
          tests: {},
          logMessages: []
        });
      });
  }, this);

  return testSequence.then(function() {
    aggregatedResults.endTime = Date.now();
    return aggregatedResults;
  });
};

/**
 * Run all given test paths in parallel using a worker pool.
 *
 * @param {Array<String>} testPaths Array of paths to test files
 * @param {Function} onResult Callback called once for each test result
 * @return {Promise<Object>} Fulfilled with aggregate pass/fail information
 *                           about all tests that were run
 */
TestRunner.prototype.runTestsParallel = function(testPaths, onResult) {
  var config = this._config;

  var aggregatedResults = {
    numFailedTests: 0,
    numTotalTests: testPaths.length,
    startTime: Date.now(),
    endTime: null
  };

  var workerPool = new WorkerPool(
    this._opts.maxWorkers,
    this._opts.nodePath,
    this._opts.nodeArgv.concat([
      '--harmony',
      TEST_WORKER_PATH,
      '--config=' + JSON.stringify(config)
    ])
  );

  return this._getModuleLoaderResourceMap()
    .then(function() {
      // Tell all workers that it's now safe to read the resource map from disk.
      return workerPool.sendMessageToAllWorkers({
        resourceMapWrittenToDisk: true
      });
    })
    .then(function() {
      return q.all(testPaths.map(function(testPath) {
        return workerPool.sendMessage({testFilePath: testPath})
          .then(function(testResult) {
            if (testResult.numFailingTests > 0) {
              aggregatedResults.numFailedTests++;
            }
            onResult && onResult(config, testResult);
          })
          .catch(function(err) {
            aggregatedResults.numFailedTests++;
            onResult(config, {
              testFilePath: testPath,
              testExecError: err,
              suites: {},
              tests: {},
              logMessages: []
            });
          });
      }));
    })
    .then(function() {
      return workerPool.destroy().then(function() {
        aggregatedResults.endTime = Date.now();
        return aggregatedResults;
      });
    });
};

module.exports = TestRunner;
