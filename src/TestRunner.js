"use strict";

var colors = require('./lib/colors');
var FileFinder = require('node-find-files');
var os = require('os');
var path = require('path');
var Q = require('q');
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
    summary += ' (' + runTime + 's)';
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

/**
 * Run all tests matching the given path pattern RegExp.
 *
 * @param pathPattern A RegExp object that a given test path must match in
 *                    order to be run.
 * @return promise Fulfilled when all tests have finished running
 */
TestRunner.prototype.run = function(pathPattern) {
  var startTime = Date.now();
  var config = this._config;
  var deferred = Q.defer();

  var workerPool = new WorkerPool(this._opts.maxWorkers, this._opts.nodePath, [
    '--harmony',
    TEST_WORKER_PATH,
    '--config=' + JSON.stringify(config),
    '--moduleLoader=' + config.moduleLoader,
    '--environmentBuilder=' + config.environmentBuilder,
    '--testRunner=' + config.testRunner
  ]);

  var numTests = 0;
  var failedTests = 0;
  function _onFinderMatch(pathStr, stat) {
    numTests++;

    workerPool.sendMessage({testFilePath: pathStr})
      .done(function(results) {
        var filteredResults = utils.filterPassingSuiteResults(results);
        var allTestsPassed = filteredResults === null;

        _printTestResultSummary(
          allTestsPassed,
          config.rootDir ? path.relative(config.rootDir, pathStr) : pathStr,
          (results.stats.end - results.stats.start) / 1000
        );

        results.consoleMessages.forEach(_printConsoleMessage);

        if (!allTestsPassed) {
          failedTests++;

          var descBullet = colorize('\u25cf ', colors.BOLD);
          var msgBullet = '  - ';
          var msgIndent = msgBullet.replace(/./g, ' ');

          var flattenedResults = utils.flattenSuiteResults(filteredResults);

          var testErrors;
          for (var testDesc in flattenedResults.failingTests) {
            testErrors = flattenedResults.failingTests[testDesc];

            console.log(descBullet + testDesc);
            testErrors.forEach(function(errorMsg) {
              console.log(msgBullet + errorMsg.replace(/\n/g, '\n' + msgIndent));
            });
          }

          //process.exit(0);
        }
      }, function(errMsg) {
        _printTestResultSummary(false, pathStr);
        console.log(errMsg);
      });
  }

  var _completedFinders = 0;
  function _onFinderComplete() {
    _completedFinders++;
    if (_completedFinders === config.jsScanDirs.length) {
      workerPool.shutDown().done(function() {
        var endTime = Date.now();
        console.log(failedTests + '/' + numTests + ' tests failed');
        console.log('Run time:', ((endTime - startTime) / 1000) + 's');
        deferred.resolve();
      }, deferred.reject);
    }
  }

  var skipRegex = new RegExp(config.dirSkipRegex);
  var scanStart = Date.now();
  config.jsScanDirs.forEach(function(scanDir) {
    var finder = new FileFinder({
      rootFolder: scanDir,
      filterFunction: function(pathStr, stat) {
        return (
          NODE_HASTE_TEST_PATH_RE.test(pathStr)
          && !HIDDEN_FILE_RE.test(pathStr)
          && pathPattern.test(pathStr)
          && !skipRegex.test(pathStr)
        );
      }
    });
    finder.on('match', _onFinderMatch);
    finder.on('complete', function() {
      var finderEnd = Date.now();
      _onFinderComplete();
    });
    finder.startSearch();
  });

  return deferred.promise;
};

module.exports = TestRunner;
