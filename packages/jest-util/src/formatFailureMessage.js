/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {Config, Path} from 'types/Config';
import type {TestResult} from 'types/TestResult';

const chalk = require('chalk');
const path = require('path');
const separateMessageFromStack = require('./separateMessageFromStack');

// filter for noisy stack trace lines
const JASMINE_IGNORE =
  /^\s+at(?:(?:.*?vendor\/|jasmine\-)|\s+jasmine\.buildExpectationResult)/;
const STACK_TRACE_IGNORE =
  /^\s+at.*?jest(-.*?)?(\/|\\)(vendor|build|node_modules|packages)(\/|\\)/;
const TITLE_INDENT = '  ';
const MESSAGE_INDENT = '    ';
const STACK_INDENT = '      ';
const ANCESTRY_SEPARATOR = ' \u203A ';
const TITLE_BULLET = chalk.bold('\u25cf ');
const STACK_TRACE_COLOR = chalk.gray;
const ERROR_MESSAGE_COLOR = chalk.red;
const STACK_PATH_REGEXP = /\s*at.*\(?(\:\d*\:\d*|native)\)?/;
const EXEC_ERROR_MESSAGE = 'Test suite failed to run:';

const trim = string => string.replace(/^\s+/, '').replace(/\s+$/, '');

// Some errors contain not only line numbers in stack traces
// e.g. SyntaxErrors can contain snippets of code, and we don't
// want to trim those, because they may have pointers to the column/character
// which will get misaligned.
const trimPaths = string =>
  string.match(STACK_PATH_REGEXP) ? trim(string) : string;

// ExecError is an error thrown outside of the test suite (not inside an `it` or
// `before/after each` hooks). If it's thrown, none of the tests in the file
// are executed.
const formatExecError = (
  testResult: TestResult,
  config: Config,
  testPath: Path,
) => {
  const error = testResult.testExecError;
  let {message, stack} = error;

  const separated = separateMessageFromStack(stack || '');
  stack = separated.stack;

  if (separated.message.indexOf(trim(message)) !== -1) {
    // Often stack trace already contains the duplicate of the message
    message = separated.message;
  } else {
    message = message + '\n' + separated.message;
  }

  message = message.split(/\n/).map(line => MESSAGE_INDENT + line).join('\n');

  message = message && ERROR_MESSAGE_COLOR(message);
  stack = stack && !config.noStackTrace
    ? '\n' + STACK_TRACE_COLOR(formatStackTrace(stack, config, testPath))
    : '';

  return TITLE_INDENT + ERROR_MESSAGE_COLOR(EXEC_ERROR_MESSAGE) + '\n' +
    message  + stack + '\n';
};

const removeInternalStackEntries = (lines, config) => {
  let pathCounter = 0;

  return lines.filter(line => {
    const isPath = STACK_PATH_REGEXP.test(line);
    if (!isPath) {
      return true;
    }
    if (JASMINE_IGNORE.test(line)) {
      return false;
    }

    if (++pathCounter === 1) {
      return true; // always keep the first line even if it's from Jest
    }

    return !(STACK_TRACE_IGNORE.test(line) || config.noStackTrace);
  });
};

const formatPaths = (config, relativeTestPath, line) => {
  // Extract the file path from the trace line.
  let matches = line.match(/(^\s*at .*?\()([^()]+)(:[0-9]+:[0-9]+\).*$)/);
  if (!matches) {
    matches = line.match(/(^\s+at )([^()]+)(:[0-9]+:[0-9]+.*$)/);
    if (!matches) {
      return line;
    }
  }

  let filePath = matches[2];
  filePath = path.relative(config.rootDir, filePath);

  if (filePath === relativeTestPath) {
    // highlight paths from the current test file
    filePath = chalk.cyan(filePath);
  }
  // make paths relative to the <rootDir>
  return matches[1] + filePath + matches[3];
};

const formatStackTrace = (stack, config, testPath) => {
  let lines = stack.split(/\n/);
  const relativeTestPath = testPath
    ? path.relative(config.rootDir, testPath)
    : null;
  lines = removeInternalStackEntries(lines, config);
  return lines.map(trimPaths)
    .map(formatPaths.bind(null, config, relativeTestPath))
    .map(line => STACK_INDENT + line)
    .join('\n');
};

const formatResultsErrors = (
  testResults: TestResult,
  config: Config,
  testPath: ?Path,
): ?string => {
  const failedResults = testResults.testResults.reduce(
    (errors, result) => {
      result.failureMessages.forEach(content => errors.push({result, content}));
      return errors;
    },
    [],
  );

  if (!failedResults.length) {
    return null;
  }

  return failedResults.map(({result, content}) => {
    let {message, stack} = separateMessageFromStack(content);
    stack = config.noStackTrace
      ? ''
      : STACK_TRACE_COLOR(formatStackTrace(stack, config, testPath)) + '\n';

    message = message
      .split(/\n/)
      .map(line => MESSAGE_INDENT + line)
      .join('\n');

    const title = TITLE_INDENT + TITLE_BULLET +
      result.ancestorTitles.join(ANCESTRY_SEPARATOR) +
      ANCESTRY_SEPARATOR + result.title + '\n';

    return title + '\n' + ERROR_MESSAGE_COLOR(message) + '\n' + stack;
  }).join('\n');
};

module.exports = {
  formatExecError,
  formatResultsErrors,
};
