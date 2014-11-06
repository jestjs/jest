/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var colors = require('./lib/colors');
var path = require('path');

var FAIL_COLOR = colors.RED_BG + colors.BOLD;
var PASS_COLOR = colors.GREEN_BG + colors.BOLD;
var TEST_NAME_COLOR = colors.BOLD;

// A RegExp that matches paths that should not be included in error stack traces
// (mostly because these paths represent noisy/unhelpful libs)
var STACK_TRACE_LINE_IGNORE_RE = new RegExp('^(?:' + [
    path.resolve(__dirname, '..', 'node_modules', 'q'),
    path.resolve(__dirname, '..', 'vendor', 'jasmine')
].join('|') + ')');

// define our text components all in one place
var textComponents = {
  passedIcon: colors.colorize(' \u221A ', colors.GREEN),
  failedIcon: colors.colorize(' x ', colors.RED),
  ancestrySeparator: ' \u203A ',
  descBullet: colors.colorize('\u25cf ', colors.BOLD),
  msgBullet: '  - '
};

var msgIndent = textComponents.msgBullet.replace(/./g, ' ');
textComponents.msgIndent = msgIndent;

function _printConsoleMessage(msg) {
  switch (msg.type) {
    case 'dir':
    case 'log':
      process.stdout.write(msg.data);
      break;
    case 'warn':
      process.stderr.write(
        colors.colorize(msg.data, colors.YELLOW)
      );
      break;
    case 'error':
      process.stderr.write(
        colors.colorize(msg.data, colors.RED)
      );
      break;
    default:
      throw new Error('Unknown console message type!: ' + msg.type);
  }
}


/**
 * Logs the passed in error
 * @param  {Object} errorMsg The error to log
 */
function _printErrors(errorMsg) {
  var msgBullet       = textComponents.msgBullet;
  var msgIndent       = textComponents.msgIndent;
  // Filter out q and jasmine entries from the stack trace.
  // They're super noisy and unhelpful
  errorMsg = errorMsg.split('\n').filter(function (line) {
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
}

function _getAncestorTitle(result, separator) {
  return result.ancestorTitles.map(function (title) {
    return colors.colorize(title, colors.BOLD);
  }).join(separator);
}

function _getFilePath(jestConfig, testResult) {
  return jestConfig.rootDir ?
         path.relative(jestConfig.rootDir, testResult.testFilePath) :
       testResult.testFilePath;
}

/**
 * Returns a colored string based on whether the
 * test failed or passed
 * @param  {Boolean} passed   Did the test pass?
 * @param  {String}  testName The test's name
 * @param  {Array}   columns  An array of items to append
 * @return {String}           The header
 */
function _getResultHeader(passed, testName, columns) {
   var passFailTag = passed ?
   colors.colorize(' PASS ', PASS_COLOR) :
   colors.colorize(' FAIL ', FAIL_COLOR);

  return [
    passFailTag,
    colors.colorize(testName, TEST_NAME_COLOR)
  ].concat(columns || []).join(' ');
}

/**
 * Kicks off rendering of the results
 */
function _displayResults(jestConfig, testResult, showDetailed) {
  var filePath = _getFilePath(jestConfig, testResult);

  // bail out instantly if the test couldn't be executed
  if (testResult.testExecError) {
    console.log(_getResultHeader(false, filePath));
    console.log(testResult.testExecError);
    return false;
  }

  var testRunTime = testResult.perfStats ?
  (testResult.perfStats.end - testResult.perfStats.start) / 1000 :
  null;

  var testRunTimeString = '(' + testRunTime + 's)';
  if (testRunTime > 2.5) {
    testRunTimeString = colors.colorize(testRunTimeString, FAIL_COLOR);
  }

  /*
  if (config.collectCoverage) {
    // TODO: Find a nice pretty way to print this out
  }
  */

  var allTestsPassed = testResult.numFailingTests === 0;

  console.log(_getResultHeader(
    allTestsPassed, filePath, [
    testRunTimeString
  ]));

  // log all caputured log messages
  testResult.logMessages.forEach(_printConsoleMessage);

  if (showDetailed) {
    _displayDetailedResults(testResult);
  } else {
    _displayConciseResults(testResult, allTestsPassed);
  }
}

/**
 * Displays both failed and passed tests
 */
function _displayDetailedResults(testResult) {
  var passedIcon        = textComponents.passedIcon;
  var failedIcon        = textComponents.failedIcon;
  var ancestrySeparator = textComponents.ancestrySeparator;
  var currentAncenstry;

  testResult.testResults.forEach(function (result) {
    var testTitleAncestry = _getAncestorTitle(result, ancestrySeparator);
    // only display the ancestry, if it changed, not for each
    // test in the suite
    if (testTitleAncestry !== currentAncenstry) {
      var maybeNewline = currentAncenstry !== undefined ? '\n' : '';
      console.log(maybeNewline, textComponents.descBullet + testTitleAncestry);
      currentAncenstry = testTitleAncestry;
    }

    var prefixIcon = result.failureMessages.length ? failedIcon : passedIcon;
    console.log(prefixIcon,result.title);
    // log all errors
    result.failureMessages.forEach(_printErrors);

  });

  // add a newline after each test group
  console.log('');
}

/**
 * Displays failed tests
 */
function _displayConciseResults(testResult, allTestsPassed) {
  if (!allTestsPassed) {
    var ancestrySeparator = textComponents.ancestrySeparator;

    testResult.testResults.forEach(function (result) {
      if (result.failureMessages.length === 0) {
        return;
      }

      var testTitleAncestry = _getAncestorTitle(result, ancestrySeparator);

      testTitleAncestry = testTitleAncestry + ancestrySeparator;
      console.log(textComponents.descBullet + testTitleAncestry + result.title);

      // log all errors
      result.failureMessages.forEach(_printErrors);

    });
  }
}

function printConciseTestResult(jestConfig, testResult) {
  _displayResults(jestConfig, testResult, false);
}

function printDetailedTestResult(jestConfig, testResult) {
  _displayResults(jestConfig, testResult, true);
}

module.exports.printConciseTestResult = printConciseTestResult;
module.exports.printDetailedTestResult = printDetailedTestResult;
