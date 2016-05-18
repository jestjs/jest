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

const ERROR_TITLE_COLOR = chalk.bold.underline.red;
// filter for noisy stack trace lines
const JASMINE_IGNORE = /^\s+at.*?vendor\/jasmine\-/;
const STACK_TRACE_IGNORE =
  /^\s+at.*?jest(-cli)?\/(vendor|src|node_modules|packages)\//;

const formatStackTrace = (stackTrace, config) => {
  const msgBullet = '  - ';
  const msgIndent = msgBullet.replace(/./g, ' ');
  let stackTraceLines = 0;
  return msgBullet + stackTrace
    // jasmine doesn't give us access to the actual Error object, so we
    // have to regexp out the message from the stack string in order to
    // colorize the `message` value
    .replace(/(^(.|\n)*?(?=\n\s*at\s))/, ERROR_TITLE_COLOR('$1'))
    .split('\n')
    .map(line => {
      // Extract the file path from the trace line.
      let matches = line.match(/(^\s+at .*?\()([^()]+)(:[0-9]+:[0-9]+\).*$)/);
      if (!matches) {
        matches = line.match(/(^\s+at )([^()]+)(:[0-9]+:[0-9]+.*$)/);
        if (!matches) {
          return line;
        }
      }

      // Filter out noisy and unhelpful lines from the stack trace.
      // Always keep the first stack trace line (except Jasmine),
      // even if it comes from Jest.
      if (
        config.noStackTrace ||
        JASMINE_IGNORE.test(line) ||
        (STACK_TRACE_IGNORE.test(line) && ++stackTraceLines > 1)
      ) {
        return null;
      }

      const filePath = matches[2];
      return matches[1] + path.relative(config.rootDir, filePath) + matches[3];
    })
    .filter(line => line !== null)
    .join('\n' + msgIndent);
};

function formatFailureMessage(testResult, config) {
  const ancestrySeparator = ' \u203A ';
  const descBullet = config.verbose ? '' : chalk.bold('\u25cf ');

  if (testResult.testExecError) {
    const error = testResult.testExecError;
    return (
      descBullet +
      (config.verbose ? 'Runtime Error' : chalk.bold('Runtime Error')) + '\n' +
      (error.stack ? formatStackTrace(error.stack, config) : error.message)
    );
  }

  return testResult.testResults
    .filter(result => result.failureMessages.length !== 0)
    .map(result => {
      const failureMessages = result.failureMessages
        .map(stackTrace => formatStackTrace(stackTrace, config))
        .join('\n');

      const testTitleAncestry = result.ancestorTitles
        .map(title => chalk.bold(title))
        .join(ancestrySeparator);

      return descBullet + testTitleAncestry + ancestrySeparator + result.title +
        '\n' + failureMessages;
    })
    .join('\n');
}

module.exports = formatFailureMessage;
