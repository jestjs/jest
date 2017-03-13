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

import type {Config, Glob, Path} from 'types/Config';
import type {AssertionResult, TestResult} from 'types/TestResult';

const chalk = require('chalk');
const micromatch = require('micromatch');
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
const STACK_TRACE_COLOR = chalk.dim;
const STACK_PATH_REGEXP = /\s*at.*\(?(\:\d*\:\d*|native)\)?/;
const EXEC_ERROR_MESSAGE = 'Test suite failed to run';

const trim = string => (string || '').replace(/^\s+/, '').replace(/\s+$/, '');

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
  let error = testResult.testExecError;
  if (!error || typeof error === 'number') {
    error = new Error(`Expected an Error, but "${String(error)}" was thrown`);
    error.stack = '';
  }

  let {message, stack} = error;

  if (typeof error === 'string' || !error) {
    error || (error = 'EMPTY ERROR');
    message = '';
    stack = error;
  }

  const separated = separateMessageFromStack(stack || '');
  stack = separated.stack;

  if (separated.message.indexOf(trim(message)) !== -1) {
    // Often stack trace already contains the duplicate of the message
    message = separated.message;
  }

  message = message.split(/\n/).map(line => MESSAGE_INDENT + line).join('\n');
  stack = stack && !config.noStackTrace
    ? '\n' + formatStackTrace(stack, config, testPath)
    : '';

  if (message.match(/^\s*$/) && stack.match(/^\s*$/)) {
    // this can happen if an empty object is thrown.
    message = MESSAGE_INDENT + 'Error: No message was provided';
  }

  return TITLE_INDENT +
    TITLE_BULLET +
    EXEC_ERROR_MESSAGE +
    '\n\n' +
    message +
    stack +
    '\n';
};

const removeInternalStackEntries = (lines, config: StackTraceOptions) => {
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

const formatPaths = (config: StackTraceOptions, relativeTestPath, line) => {
  // Extract the file path from the trace line.
  const match = line.match(/(^\s*at .*?\(?)([^()]+)(:[0-9]+:[0-9]+\)?.*$)/);
  if (!match) {
    return line;
  }

  let filePath = path.relative(config.rootDir, match[2]);
  // highlight paths from the current test file
  if (
    (config.testMatch &&
      config.testMatch.length &&
      micromatch(filePath, config.testMatch)) ||
    filePath === relativeTestPath
  ) {
    filePath = chalk.reset.cyan(filePath);
  }
  return STACK_TRACE_COLOR(match[1]) + filePath + STACK_TRACE_COLOR(match[3]);
};

type StackTraceOptions = {
  noStackTrace: boolean,
  rootDir: string,
  testMatch: Array<Glob>,
};

const formatStackTrace = (
  stack,
  config: StackTraceOptions,
  testPath: ?Path,
) => {
  let lines = stack.split(/\n/);
  const relativeTestPath = testPath
    ? path.relative(config.rootDir, testPath)
    : null;
  lines = removeInternalStackEntries(lines, config);
  return lines
    .map(trimPaths)
    .map(formatPaths.bind(null, config, relativeTestPath))
    .map(line => STACK_INDENT + line)
    .join('\n');
};

const formatResultsErrors = (
  testResults: Array<AssertionResult>,
  config: Config,
  testPath: ?Path,
): ?string => {
  const failedResults = testResults.reduce(
    (errors, result) => {
      result.failureMessages.forEach(content => errors.push({content, result}));
      return errors;
    },
    [],
  );

  if (!failedResults.length) {
    return null;
  }

  return failedResults
    .map(({result, content}) => {
      let {message, stack} = separateMessageFromStack(content);
      stack = config.noStackTrace
        ? ''
        : STACK_TRACE_COLOR(formatStackTrace(stack, config, testPath)) + '\n';

      message = message
        .split(/\n/)
        .map(line => MESSAGE_INDENT + line)
        .join('\n');

      const title = chalk.bold.red(
        TITLE_INDENT +
          TITLE_BULLET +
          result.ancestorTitles.join(ANCESTRY_SEPARATOR) +
          (result.ancestorTitles.length ? ANCESTRY_SEPARATOR : '') +
          result.title,
      ) + '\n';

      return title + '\n' + message + '\n' + stack;
    })
    .join('\n');
};

module.exports = {
  formatExecError,
  formatResultsErrors,
  formatStackTrace,
};
