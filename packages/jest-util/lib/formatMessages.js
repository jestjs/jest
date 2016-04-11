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

const KEEP_TRACE_LINES = 2;
// filter for noisy stack trace lines
const STACK_TRACE_LINE_IGNORE_RE =
  /^\s+at.*?jest(-cli)?\/(vendor|src|node_modules|packages)\//;

function cleanStackTrace(stackTrace) {
  let lines = 0;
  return stackTrace.split('\n')
    .filter(line =>
      (lines++ < KEEP_TRACE_LINES) || !STACK_TRACE_LINE_IGNORE_RE.test(line)
    )
    .join('\n');
}

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
      (error.stack ? cleanStackTrace(error.stack) : error.message)
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
            // Filter out noisy and unhelpful lines from the stack trace.
            if (STACK_TRACE_LINE_IGNORE_RE.test(line)) {
              return null;
            }

            const filePath = matches[2];
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
