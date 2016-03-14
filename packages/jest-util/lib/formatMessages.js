/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const chalk = require('chalk');
const path = require('path');

function isExternalStackEntry(entry) {
  return (entry ? true : false);
}

function getRelevantStackFrom(stack) {
  stack = stack.split('\n');

  let filteredStack = stack.filter((entry) => {
    return isExternalStackEntry(entry);
  });

  if (filteredStack.length === 0) {
    filteredStack = stack;
  }

  return filteredStack;
}

function formatFailedStep(step) {

  let relevantMessage = [];
  let relevantStack = [];

  let stack = step.stack.replace('Error: ' + step.message, '');
  let dirtyRelevantStack = getRelevantStackFrom(stack);

  dirtyRelevantStack.forEach((message) => {
    if (step.message && step.message.indexOf(message) === -1) {
      relevantStack.push(message);
    } else {
      relevantMessage.push(message);
    }
  });

  if (relevantMessage.length === 0) {
    relevantMessage.push(step.message);

    if (relevantStack.length && relevantStack[0].indexOf(step.message) !== -1) {
      relevantStack.shift();
    }
  }

  return relevantMessage.concat(relevantStack).join('\n');
}

const KEEP_TRACE_LINES = 2;
function cleanStackTrace(stackTrace) {
  // Remove jasmine jonx from the stack trace
  let lines = 0;
  const keepFirstLines = () => (lines++ < KEEP_TRACE_LINES);
  return stackTrace.split('\n').filter(line => (
    keepFirstLines() ||
    !/^\s+at.*?jest(-cli)?\/(vendor|src|node_modules)\//.test(line)
  )).join('\n');
}

// A RegExp that matches paths that should not be included in error stack traces
// (mostly because these paths represent noisy/unhelpful libs)
const STACK_TRACE_LINE_IGNORE_RE = new RegExp([
  '^timers.js$',
  '^' + path.resolve(__dirname, '..', 'lib', 'moduleMocker.js'),
  '^' + path.resolve(__dirname, '..', '..', 'vendor', 'jasmine'),
].join('|'));

/**
 * Given a test result, return a human readable string representing the
 * failures.
 *
 * @param {Object} testResult
 * @param {Object} config Containing the following keys:
 *   `rootPath` - Root directory (for making stack trace paths relative).
 *   `useColor` - True if message should include color flags.
 * @return {String}
 */
function formatFailureMessage(testResult, config) {
  const rootDir = config.rootDir;

  const ancestrySeparator = ' \u203A ';
  const descBullet = config.verbose ? '' : chalk.bold('\u25cf ');
  const msgBullet = '  - ';
  const msgIndent = msgBullet.replace(/./g, ' ');

  if (testResult.testExecError) {
    const error = testResult.testExecError;
    return (
      descBullet +
      (config.verbose ? 'Runtime Error' : chalk.bold('Runtime Error')) + '\n' +
      chalk.red(formatFailedStep(error))
    );
  }

  return testResult.testResults
    .filter(result => result.failureMessages.length !== 0)
    .map(result => {
      const failureMessages = result.failureMessages.map(errorMsg => {
        errorMsg = errorMsg.split('\n')
          .map(line => {
            // Extract the file path from the trace line.
            let matches =
              line.match(/(^\s+at .*?\()([^()]+)(:[0-9]+:[0-9]+\).*$)/);
            if (!matches) {
              matches = line.match(/(^\s+at )([^()]+)(:[0-9]+:[0-9]+.*$)/);
              if (!matches) {
                return line;
              }
            }
            var filePath = matches[2];
            // Filter out noisy and unhelpful lines from the stack trace.
            if (STACK_TRACE_LINE_IGNORE_RE.test(filePath)) {
              return null;
            }
            return (
              matches[1] +
              path.relative(rootDir, filePath) +
              matches[3]
            );
          })
          .filter(line => line !== null)
          .join('\n');

        return msgBullet + errorMsg.replace(/\n/g, '\n' + msgIndent);
      }).join('\n');

      const testTitleAncestry = result.ancestorTitles.map(
          title => chalk.bold(title)
        ).join(ancestrySeparator) + ancestrySeparator;

      return descBullet + testTitleAncestry + result.title + '\n' +
        failureMessages;
    })
    .join('\n');
}

exports.cleanStackTrace = cleanStackTrace;
exports.formatFailureMessage = formatFailureMessage;
