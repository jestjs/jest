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

function _getResultHeader(passed, testName, columns) {
  var passFailTag = passed
    ? colors.colorize(' PASS ', PASS_COLOR)
    : colors.colorize(' FAIL ', FAIL_COLOR);

  return [
    passFailTag,
    colors.colorize(testName, TEST_NAME_COLOR)
  ].concat(columns || []).join(' ');
}

function defaultTestResultHandler(config, testResult) {
  var pathStr =
    config.rootDir
    ? path.relative(config.rootDir, testResult.testFilePath)
    : testResult.testFilePath;

  if (testResult.testExecError) {
    console.log(_getResultHeader(false, pathStr));
    console.log(testResult.testExecError);
    return false;
  }

  var allTestsPassed = testResult.numFailingTests === 0;

  var testRunTime =
    testResult.perfStats
    ? (testResult.perfStats.end - testResult.perfStats.start) / 1000
    : null;

  var testRunTimeString = '(' + testRunTime + 's)';
  if (testRunTime > 2.5) {
    testRunTimeString = colors.colorize(testRunTimeString, FAIL_COLOR);
  }

  /*
  if (config.collectCoverage) {
    // TODO: Find a nice pretty way to print this out
  }
  */

  console.log(_getResultHeader(allTestsPassed, pathStr, [
    testRunTimeString
  ]));

  testResult.logMessages.forEach(_printConsoleMessage);

  if (!allTestsPassed) {
    var ancestrySeparator = ' \u203A ';
    var descBullet = colors.colorize('\u25cf ', colors.BOLD);
    var msgBullet = '  - ';
    var msgIndent = msgBullet.replace(/./g, ' ');

    testResult.testResults.forEach(function(result) {
      if (result.failureMessages.length === 0) {
        return;
      }

      var testTitleAncestry =
        result.ancestorTitles.map(function(title) {
          return colors.colorize(title, colors.BOLD);
        }).join(ancestrySeparator) + ancestrySeparator;

      console.log(descBullet + testTitleAncestry + result.title);

      result.failureMessages.forEach(function(errorMsg) {
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
    });
  }
}

module.exports = defaultTestResultHandler;
