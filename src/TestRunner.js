"use strict";

var colors = require('./lib/colors');
var FileFinder = require('node-find-files');
var os = require('os');
var path = require('path');
var Q = require('q');
var stream = require('stream');
var TestWorker = require('./TestWorker');
var utils = require('./lib/utils');
var WorkerPool = require('node-worker-pool');

var colorize = colors.colorize;

// A RegExp that matches paths that should not be included in error stack traces
// (mostly because these paths represent noisy/unhelpful libs)
var STACK_TRACE_LINE_IGNORE_RE = new RegExp('^(?:' + [
    path.resolve(__dirname, '..', 'node_modules', 'q'),
    path.resolve(__dirname, '..', 'src', 'vendor', 'jasmine')
].join('|') + ')');

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
  nodePath: process.execPath
};

var HIDDEN_FILE_RE = /\/\.[^\/]*$/;
var NODE_HASTE_TEST_PATH_RE = /\/__tests__\/.*\.js$/;

var FAIL_COLOR = colors.RED_BG;
var PASS_COLOR = colors.GREEN_BG;
var TEST_TITLE_COLOR = colors.BOLD + colors.UNDERLINE;

function _printConsoleMessage(msg) {
  switch (msg.type) {
    case 'error':
      // TODO: jstest doesn't print console.error messages.
      //       This is a big WAT, and we should come back to this -- but
      //       right now the goal is jest/jstest feature parity, not test
      //       cleanup.
      break;

      console.error.apply(console, msg.args.map(function(arg) {
        arg = utils.stringifySerializedConsoleArgValue(arg);
        return colorize(arg, colors.RED);
      }));
      break;
    case 'log':
      console.log.apply(console, msg.args.map(function(arg) {
        arg = utils.stringifySerializedConsoleArgValue(arg);
        return colorize(arg, colors.GRAY);
      }));
      break;
    case 'warn':
      // TODO: jstest doesn't print console.warn messages.
      //       Turning this on gets pretty noisy...but we should probably
      //       clean this up as warns are likely a sign of clownitude
      break;
      console.warn.apply(console, msg.args.map(function(arg) {
        arg = utils.stringifySerializedConsoleArgValue(arg);
        return colorize(arg, colors.RED);
      }));
      break;
    default:
      throw new Error('Unknown console message type!: ' + JSON.stringify(msg));
  }
}

function _printTestResultSummary(passed, testPath, runTime) {
  var passFailTag = passed
    ? colorize(' PASS ', PASS_COLOR)
    : colorize(' FAIL ', FAIL_COLOR);

  var summary = passFailTag + ' ' + colorize(testPath, TEST_TITLE_COLOR);

  if (runTime) {
    var runTimeStr = '(' + runTime + 's)';
    if (runTime > 2.5) {
      runTimeStr = colorize(runTimeStr, FAIL_COLOR);
    }
    summary += ' ' + runTimeStr;
  }

  console.log(summary);
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
  this._opts = Object.create(DEFAULT_OPTIONS);

  if (options) {
    for (var key in options) {
      this._opts[key] = options[key];
    }
  }
}

TestRunner.prototype._getTestFinderStream = function(
    scanDirs, skipPattern, pathPattern, onFind, onComplete) {
  var numMatchers = scanDirs.length;
  function _onMatcherEnd() {
    numMatchers--;
    if (numMatchers === 0) {
      onComplete();
    }
  }

  function _onMatcherMatch(pathStr) {
    onFind(pathStr);
  }

  scanDirs.forEach(function(scanDir) {
    var finder = new FileFinder({
      rootFolder: scanDir,
      filterFunction: function(pathStr, stat) {
        return (
          NODE_HASTE_TEST_PATH_RE.test(pathStr)
          && !HIDDEN_FILE_RE.test(pathStr)
          && pathPattern.test(pathStr)
          && !skipPattern.test(pathStr)
        );
      }
    });
    finder.on('match', _onMatcherMatch);
    finder.on('complete', _onMatcherEnd);
    finder.startSearch();
  });
};

TestRunner.prototype._printTestResults = function(results) {
  var pathStr = results.testFilePath;
  var filteredResults = utils.filterPassingSuiteResults(results);
  var allTestsPassed = filteredResults === null;

  var rootDir = this._config.rootDir;
  _printTestResultSummary(
    allTestsPassed,
    rootDir ? path.relative(rootDir, pathStr) : pathStr,
    (results.stats.end - results.stats.start) / 1000
  );

  results.consoleMessages.forEach(_printConsoleMessage);

  if (!allTestsPassed) {
    var descBullet = colorize('\u25cf ', colors.BOLD);
    var msgBullet = '  - ';
    var msgIndent = msgBullet.replace(/./g, ' ');

    var flattenedResults = utils.flattenSuiteResults(filteredResults);

    var testErrors;
    for (var testDesc in flattenedResults.failingTests) {
      testErrors = flattenedResults.failingTests[testDesc];

      console.log(descBullet + testDesc);
      testErrors.forEach(function(errorMsg) {
        // Filter out q and jasmine entries from the stack trace.
        // They're super noisy and unhelpful
        errorMsg = errorMsg.split('\n').filter(function(line) {
          if (/^\s+at .*?/.test(line)) {
            // Extract the file path from the trace line
            var filePath = line.match(/(?:\(|at (?=\/))(.*):[0-9]+:[0-9]+\)?$/);
            if (filePath
                && STACK_TRACE_LINE_IGNORE_RE.test(filePath[1])) {
              return false;
            }
          }
          return true;
        }).join('\n');
        console.log(msgBullet + errorMsg.replace(/\n/g, '\n' + msgIndent));
      });
    }
  }

  return allTestsPassed;
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

  var workerPool = new WorkerPool(this._opts.maxWorkers, this._opts.nodePath, [
    '--harmony',
    TEST_WORKER_PATH,
    '--config=' + JSON.stringify(config),
    '--moduleLoader=' + config.moduleLoader,
    '--environmentBuilder=' + config.environmentBuilder,
    '--testRunner=' + config.testRunner
  ]);

  var deferred = Q.defer();
  var failedTests = 0;
  var numTests = 0;
  var self = this;

  function _onTestFound(pathStr) {
    numTests++;
    workerPool.sendMessage({testFilePath: pathStr}).done(function(results) {
      var allTestsPassed = self._printTestResults(results);
      if (!allTestsPassed) failedTests++
    }, function(errMsg) {
      _printTestResultSummary(false, pathStr);
      console.log(errMsg);
    });
  }

  function _onSearchComplete() {
    workerPool.shutDown().done(function() {
      var endTime = Date.now();
      console.log(failedTests + '/' + numTests + ' tests failed');
      console.log('Run time:', ((endTime - startTime) / 1000) + 's');
      deferred.resolve();
    }, deferred.reject);
  }

  this._getTestFinderStream(
    config.jsScanDirs,
    new RegExp(config.dirSkipRegex),
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

  // TODO: This is copypasta from TestWorker.js
  //
  //       At some point we should probably just fold TestWorker.js into this
  //       file and make all of its operations methods on TestRunner
  var config = this._config;
  var ModuleLoader = require(config.moduleLoader);
  var environmentBuilder = require(config.environmentBuilder);
  var testRunner = require(config.testRunner);

  var dirSkipPattern = new RegExp(config.dirSkipRegex);
  var runTest = TestWorker.runTest.bind(null, config, testRunner);
  var self = this;

  return ModuleLoader.loadResourceMap(config).then(function(resourceMap) {
    var deferred = Q.defer();
    var failedTests = 0;
    var numTests = 0;
    var lastTest = Q();

    function _onTestFound(pathStr) {
      numTests++;
      lastTest = lastTest.then(function() {
        var environment = environmentBuilder();
        var moduleLoader = new ModuleLoader(config, environment, resourceMap);

        return runTest(environment, moduleLoader, pathStr)
          .then(function(results) {
            var allTestsPassed = self._printTestResults(results);
            if (!allTestsPassed) failedTests++
          });
      });
    }

    function _onSearchComplete() {
      lastTest.then(function() {
        var endTime = Date.now();
        console.log(failedTests + '/' + numTests + ' tests failed');
        console.log('Run time:', ((endTime - startTime) / 1000) + 's');
        deferred.resolve();
      });
    }

    self._getTestFinderStream(
      config.jsScanDirs,
      dirSkipPattern,
      pathPattern,
      _onTestFound,
      _onSearchComplete
    );

    return deferred.promise;
  });
};

module.exports = TestRunner;
