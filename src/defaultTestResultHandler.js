/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/* jslint node:true */
'use strict';

var colors = require('./lib/colors');
var path = require('path');
var utils = require('./lib/utils');

var FAIL_COLOR = colors.RED_BG + colors.BOLD;
var PASS_COLOR = colors.GREEN_BG + colors.BOLD;
var TEST_NAME_COLOR = colors.BOLD;

// A RegExp that matches paths that should not be included in error stack traces
// (mostly because these paths represent noisy/unhelpful libs)
var STACK_TRACE_LINE_IGNORE_RE = new RegExp('^(?:' + [
    path.resolve(__dirname, '..', 'node_modules', 'q'),
    path.resolve(__dirname, '..', 'vendor', 'jasmine')
].join('|') + ')');

function _printConsoleMessage(msg) {
  switch (msg.type) {
    case 'error':
      // TODO: jstest doesn't print console.error messages.
      //       This is a big WAT, and we should come back to this -- but
      //       right now the goal is jest/jstest feature parity, not test
      //       cleanup.
      break;

      /*
      console.error.apply(console, msg.args.map(function(arg) {
        arg = utils.stringifySerializedConsoleArgValue(arg);
        return colors.colorize(arg, colors.RED);
      }));
      break;
      */
    case 'log':
      console.log.apply(console, msg.args.map(function(arg) {
        return utils.stringifySerializedConsoleArgValue(arg);
      }));
      break;
    case 'warn':
      // TODO: jstest doesn't print console.warn messages.
      //       Turning this on gets pretty noisy...but we should probably
      //       clean this up as warns are likely a sign of clownitude
      break;

      /*
      console.warn.apply(console, msg.args.map(function(arg) {
        arg = utils.stringifySerializedConsoleArgValue(arg);
        return colors.colorize(arg, colors.RED);
      }));
      break;
      */
    default:
      throw new Error('Unknown console message type!: ' + JSON.stringify(msg));
  }
}

var DefaultTestResultHandler = function DefaultTestResultHandler(jestConfig, testResult, options) {
  this.showDetailedInfo = options && options.showDetailedInfo === true;
  this.testResult = testResult;
  this.filePath = jestConfig.rootDir ?
                  path.relative(jestConfig.rootDir, testResult.testFilePath) :
                  testResult.testFilePath;

  this.allTestsPassed = testResult.numFailingTests === 0;

  // define our text components all in one place
  this.textComponents = {
    passedIcon: colors.colorize(' \u221A ', colors.GREEN),
    failedIcon: colors.colorize(' x ', colors.RED),
    ancestrySeparator: ' \u203A ',
    descBullet: colors.colorize('\u25cf ', colors.BOLD),
    msgBullet: '  - '
  };

  this.textComponents.msgIndent = this.textComponents.msgBullet.replace(/./g, ' ');
};

/**
 * Returns a colored string based on whether the
 * test failed or passed
 * @param  {Boolean} passed   Did the test pass?
 * @param  {String}  testName The test's name
 * @param  {Array}   columns  An array of items to append
 * @return {String}           The header
 */
DefaultTestResultHandler.prototype._getResultHeader = function (passed, testName, columns) {
   var passFailTag = passed ?
                     colors.colorize(' PASS ', PASS_COLOR) :
                     colors.colorize(' FAIL ', FAIL_COLOR);

  return [
    passFailTag,
    colors.colorize(testName, TEST_NAME_COLOR)
  ].concat(columns || []).join(' '); 
};

/**
 * Kicks off rendering of the results
 */
DefaultTestResultHandler.prototype.displayResults = function () {
  var testResult = this.testResult;

  // bail out instantly if the test couldn't be executed
  if (testResult.testExecError) {
    console.log(this._getResultHeader(false, this.filePath));
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

  console.log(this._getResultHeader(this.allTestsPassed, this.filePath, [
    testRunTimeString
  ]));

  // log all caputured log messages
  testResult.logMessages.forEach(_printConsoleMessage);

  if (this.showDetailedInfo) {
    this._displayDetailedResults();
  } else {
    this._displayResults();
  }
};

/**
 * Displays both failed and passed tests
 */
DefaultTestResultHandler.prototype._displayDetailedResults = function () {
  var textComponents    = this.textComponents;
  var passedIcon        = textComponents.passedIcon;
  var failedIcon        = textComponents.failedIcon;
  var ancestrySeparator = textComponents.ancestrySeparator;
  var _printErrors      = this._printErrors.bind(this);

  var currentAncenstry;
  this.testResult.testResults.forEach(function (result) {
    var testTitleAncestry = DefaultTestResultHandler.getAncestorTitle(result, ancestrySeparator);
    // only display the ancestry, if it changed, not for each
    // test in the suite
    if (testTitleAncestry !== currentAncenstry) {
      console.log("\n", textComponents.descBullet + testTitleAncestry);
      currentAncenstry = testTitleAncestry;
    }

    var prefixIcon = result.failureMessages.length ? failedIcon : passedIcon;
    console.log(prefixIcon,result.title);
    // log all errors
    result.failureMessages.forEach(_printErrors);

  });
};

/**
 * Displays failed tests
 */
DefaultTestResultHandler.prototype._displayResults = function () {
  if (!this.allTestsPassed) {

    var textComponents    = this.textComponents;
    var ancestrySeparator = textComponents.ancestrySeparator;
    var _printErrors      = this._printErrors.bind(this);

    this.testResult.testResults.forEach(function (result) {
      if (result.failureMessages.length === 0) {
        return;
      }

      var testTitleAncestry = DefaultTestResultHandler.getAncestorTitle(result, ancestrySeparator) + ancestrySeparator;
      console.log(textComponents.descBullet + testTitleAncestry + result.title);

      // log all errors
      result.failureMessages.forEach(_printErrors);

    });
  }
};

/**
 * Logs the passed in error
 * @param  {Object} errorMsg The error to log
 */
DefaultTestResultHandler.prototype._printErrors = function (errorMsg) {
  var textComponents  = this.textComponents;
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
};


DefaultTestResultHandler.getAncestorTitle = function (result, separator) {
  return result.ancestorTitles.map(function (title) {
    return colors.colorize(title, colors.BOLD);
  }).join(separator);
};

module.exports = DefaultTestResultHandler;
