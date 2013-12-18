"use strict";
var colors = require('./src/lib/colors');
var FileFinder = require('node-find-files');
var path = require('path');
var Q = require('q');
var utils = require('./src/lib/utils');
var WorkerPool = require('node-worker-pool');

var colorize = colors.colorize;

var CONFIG_FILE_PATH = path.resolve(__dirname, './testConfig.json');

var HIDDEN_FILE_REGEXP = /\/\.[^\/]*$/;
var TEST_FILE_PATH_REGEXP = /\/__tests__\/.*\.js$/;

var FAIL_COLOR = colors.RED_BG;
var PASS_COLOR = colors.GREEN_BG;
var TEST_TITLE_COLOR = colors.BOLD + colors.UNDERLINE;

function _aggregateSuiteResults(suite) {
  var failingTests = {};
  var numPassingTests = 0;

  var testResults;
  for (var testName in suite.tests) {
    testResults = suite.tests[testName];

    if (testResults.failureMessages.length > 0) {
      failingTests['it ' + testName] = testResults.failureMessages;
    }
    numPassingTests += testResults.numPassingTests;
  }

  var suiteResults;
  for (var suiteName in suite.suites) {
    suiteResults = _aggregateSuiteResults(suite.suites[suiteName]);

    if (Object.keys(suiteResults.failingTests).length > 0) {
      var newTestName;
      for (var testName in suiteResults.failingTests) {
        newTestName =
          colorize(suiteName, colors.BOLD) + ' \u203A ' + testName;
        failingTests[newTestName] = suiteResults.failingTests[testName];
      }
    }
    numPassingTests += suiteResults.numPassingTests;
  }

  return {
    failingTests: failingTests,
    numPassingTests: numPassingTests
  }
}

function _filterPassingSuites(suite) {
  var suites = {};
  var tests = {};

  var hasFailingTests = false;

  for (var testName in suite.tests) {
    if (suite.tests[testName].failureMessages.length > 0) {
      tests[testName] = suite.tests[testName];
      hasFailingTests = true;
    }
  }

  for (var suiteName in suite.suites) {
    if (_filterPassingSuites(suite.suites[suiteName]) !== null) {
      suites[suiteName] = suite.suites[suiteName];
      hasFailingTests = true;
    }
  }

  if (!hasFailingTests) {
    return null;
  } else {
    return {
      suites: suites,
      tests: tests
    };
  }
}

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

function runTestsByPathPattern(config, pathPattern) {
  var workerPool = new WorkerPool(8, 'node', [
    '--harmony',
    config.testRunner,
    '--config=' + JSON.stringify(config)
  ]);

  var dirSkipRegex = new RegExp(config.dirSkipRegex);

  var numTests = 0;
  var failedTests = 0;
  function _onFinderMatch(pathStr, stat) {
    numTests++;

    workerPool.sendMessage({testFilePath: pathStr}).done(function(results) {
      if (results === undefined) {
        console.log(JSON.stringify(results));
        throw new Error(pathStr);
      }
      var filteredResults = _filterPassingSuites(results);
      var allTestsPassed = filteredResults === null;

      var passFailTag = allTestsPassed
        ? colorize(' PASS ', PASS_COLOR)
        : colorize(' FAIL ', FAIL_COLOR);

      console.log(passFailTag + ' ' + colorize(pathStr, TEST_TITLE_COLOR));

      results.consoleMessages.forEach(_printConsoleMessage);

      if (!allTestsPassed) {
        failedTests++;

        var descBullet = colorize('\u25cf ', colors.BOLD);
        var msgBullet = '  - ';
        var msgIndent = msgBullet.replace(/./g, ' ');

        var aggregatedResults = _aggregateSuiteResults(filteredResults);

        var testErrors;
        for (var testDesc in aggregatedResults.failingTests) {
          testErrors = aggregatedResults.failingTests[testDesc];

          console.log(descBullet + testDesc);
          testErrors.forEach(function(errorMsg) {
            console.log(msgBullet + errorMsg.replace(/\n/g, '\n' + msgIndent));
          });
        }
      }
    });
  }

  var _completedFinders = 0;
  function _onFinderComplete() {
    _completedFinders++;
    if (_completedFinders === config.jsScanDirs.length) {
      workerPool.shutDown().done(function() {
        console.log(failedTests + '/' + numTests + ' tests failed!');
      });
    }
  }

  config.jsScanDirs.forEach(function(scanDir) {
    var finder = new FileFinder({
      rootFolder: scanDir,
      filterFunction: function(pathStr, stat) {
        return (
          TEST_FILE_PATH_REGEXP.test(pathStr)
          && !HIDDEN_FILE_REGEXP.test(pathStr)
          && pathPattern.test(pathStr)
          && !dirSkipRegex.test(pathStr)
        );
      }
    });
    finder.on('match', _onFinderMatch);
    finder.on('complete', _onFinderComplete);
    finder.startSearch();
  });
}

utils.loadConfigFromFile(CONFIG_FILE_PATH).done(function(config) {
  var argv = require('optimist').argv;
  var searchPathPattern =
    argv.all || argv._.length == 0
    ? /.*/
    : new RegExp(argv._.join('|'));
  runTestsByPathPattern(config, searchPathPattern);
});
