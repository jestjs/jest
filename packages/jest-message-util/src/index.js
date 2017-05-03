/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Glob, Path} from 'types/Config';
import type {AssertionResult, TestResult} from 'types/TestResult';

const chalk = require('chalk');
const micromatch = require('micromatch');
const path = require('path');
const slash = require('slash');

type StackTraceConfig = {
  rootDir: string,
  testMatch: Array<Glob>,
};

type StackTraceOptions = {
  noStackTrace: boolean,
};

// filter for noisy stack trace lines
/* eslint-disable max-len */
const JASMINE_IGNORE = /^\s+at(?:(?:.*?vendor\/|jasmine\-)|\s+jasmine\.buildExpectationResult)/;
const STACK_TRACE_IGNORE = /^\s+at.*?jest(-.*?)?(\/|\\)(build|node_modules|packages)(\/|\\)/;
/* eslint-enable max-len */
const TITLE_INDENT = '  ';
const MESSAGE_INDENT = '    ';
const STACK_INDENT = '      ';
const ANCESTRY_SEPARATOR = ' \u203A ';
const TITLE_BULLET = chalk.bold('\u25cf ');
const STACK_TRACE_COLOR = chalk.dim;
const STACK_PATH_REGEXP = /\s*at.*\(?(\:\d*\:\d*|native)\)?/;
const EXEC_ERROR_MESSAGE = 'Test suite failed to run';
const ERROR_TEXT = 'Error: ';

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
  config: StackTraceConfig,
  options: StackTraceOptions,
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
  stack = stack && !options.noStackTrace
    ? '\n' + formatStackTrace(stack, config, options, testPath)
    : '';

  if (message.match(/^\s*$/) && stack.match(/^\s*$/)) {
    // this can happen if an empty object is thrown.
    message = MESSAGE_INDENT + 'Error: No message was provided';
  }

  return (
    TITLE_INDENT +
    TITLE_BULLET +
    EXEC_ERROR_MESSAGE +
    '\n\n' +
    message +
    stack +
    '\n'
  );
};

const removeInternalStackEntries = (lines, options: StackTraceOptions) => {
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

    return !(STACK_TRACE_IGNORE.test(line) || options.noStackTrace);
  });
};

const formatPaths = (
  config: StackTraceConfig,
  options: StackTraceOptions,
  relativeTestPath,
  line,
) => {
  // Extract the file path from the trace line.
  const match = line.match(/(^\s*at .*?\(?)([^()]+)(:[0-9]+:[0-9]+\)?.*$)/);
  if (!match) {
    return line;
  }

  let filePath = slash(path.relative(config.rootDir, match[2]));
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

const formatStackTrace = (
  stack: string,
  config: StackTraceConfig,
  options: StackTraceOptions,
  testPath: ?Path,
) => {
  let lines = stack.split(/\n/);
  const relativeTestPath = testPath
    ? slash(path.relative(config.rootDir, testPath))
    : null;
  lines = removeInternalStackEntries(lines, options);
  return lines
    .map(trimPaths)
    .map(formatPaths.bind(null, config, options, relativeTestPath))
    .map(line => STACK_INDENT + line)
    .join('\n');
};

const formatResultsErrors = (
  testResults: Array<AssertionResult>,
  config: StackTraceConfig,
  options: StackTraceOptions,
  testPath: ?Path,
): ?string => {
  const failedResults = testResults.reduce((errors, result) => {
    result.failureMessages.forEach(content => errors.push({content, result}));
    return errors;
  }, []);

  if (!failedResults.length) {
    return null;
  }

  return failedResults
    .map(({result, content}) => {
      let {message, stack} = separateMessageFromStack(content);
      stack = options.noStackTrace
        ? ''
        : STACK_TRACE_COLOR(
            formatStackTrace(stack, config, options, testPath),
          ) + '\n';

      message = message
        .split(/\n/)
        .map(line => MESSAGE_INDENT + line)
        .join('\n');

      const title =
        chalk.bold.red(
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

// jasmine and worker farm sometimes don't give us access to the actual
// Error object, so we have to regexp out the message from the stack string
// to format it.
const separateMessageFromStack = (content: string) => {
  if (!content) {
    return {message: '', stack: ''};
  }

  const messageMatch = content.match(/(^(.|\n)*?(?=\n\s*at\s.*\:\d*\:\d*))/);
  let message = messageMatch ? messageMatch[0] : 'Error';
  const stack = messageMatch ? content.slice(message.length) : content;
  // If the error is a plain error instead of a SyntaxError or TypeError
  // we remove it from the message because it is generally not useful.
  if (message.startsWith(ERROR_TEXT)) {
    message = message.substr(ERROR_TEXT.length);
  }
  return {message, stack};
};

module.exports = {
  formatExecError,
  formatResultsErrors,
  formatStackTrace,
  separateMessageFromStack,
};
