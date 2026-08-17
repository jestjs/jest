/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {fileURLToPath} from 'url';
import {codeFrameColumns} from '@babel/code-frame';
import chalk from 'chalk';
import * as fs from 'graceful-fs';
import picomatch from 'picomatch';
import slash from 'slash';
import StackUtils from 'stack-utils';
import type {Config, TestResult} from '@jest/types';
import {isError} from 'jest-util';
import {format as prettyFormat} from 'pretty-format';
import type {Frame} from './types';

export type {Frame} from './types';

// stack utils tries to create pretty stack by making paths relative.
const stackUtils = new StackUtils({cwd: 'something which does not exist'});

let nodeInternals: Array<RegExp> = [];

try {
  nodeInternals = StackUtils.nodeInternals();
} catch {
  // `StackUtils.nodeInternals()` fails in browsers. We don't need to remove
  // node internals in the browser though, so no issue.
}

export type StackTraceConfig = Pick<
  Config.ProjectConfig,
  'rootDir' | 'testMatch'
>;

export type StackTraceOptions = {
  noStackTrace: boolean;
  noCodeFrame?: boolean;
};

const PATH_NODE_MODULES = `${path.sep}node_modules${path.sep}`;
// In a checkout of this repo the packages sit next to each other, and frames
// from any of them — not just the `jest-` prefixed ones — are internal. Derive
// that directory rather than matching its name, so it holds whatever the
// checkout is called. An install resolves to `node_modules`, covered above.
const maybePackagesDir = path.resolve(__dirname, '..', '..');
const PATH_JEST_PACKAGES =
  path.basename(maybePackagesDir) === 'packages'
    ? maybePackagesDir + path.sep
    : null;

// filter for noisy stack trace lines
const JASMINE_IGNORE =
  /^\s+at(?:(?:.jasmine-)|\s+jasmine\.buildExpectationResult)/;
const JEST_INTERNALS_IGNORE =
  /^\s+at(?:.*[/\\])?(?:@jest[/\\][^/\\]+|[^/\\]*jest[^/\\]*)[/\\](?:build|node_modules)[/\\]/;
const ANONYMOUS_FN_IGNORE = /^\s+at <anonymous>/;
const ANONYMOUS_PROMISE_IGNORE = /^\s+at (?:new )?Promise \(<anonymous>\)/;
const ANONYMOUS_GENERATOR_IGNORE = /^\s+at Generator\.next \(<anonymous>\)/;
const NATIVE_NEXT_IGNORE = /^\s+at next \(native\)/;
const TITLE_INDENT = '  ';
const MESSAGE_INDENT = '    ';
const STACK_INDENT = '      ';
const ANCESTRY_SEPARATOR = ' \u203A ';
const TITLE_BULLET = chalk.bold('\u25CF ');
const STACK_TRACE_COLOR = chalk.dim;
const STACK_PATH_REGEXP = /\s*at.*\(?(:\d*:\d*|native)\)?/;
const EXEC_ERROR_MESSAGE = 'Test suite failed to run';
const NOT_EMPTY_LINE_REGEXP = /^(?!$)/gm;

export const indentAllLines = (lines: string): string =>
  lines.replaceAll(NOT_EMPTY_LINE_REGEXP, MESSAGE_INDENT);

// chalk colours each line of its input separately, so handing it a multi-line
// string turns the blank ones into escape-code-only lines that no longer compare
// equal to ''. Colouring line by line keeps blank lines genuinely blank.
const colorStackLines = (stack: string): string =>
  stack
    .split('\n')
    .map(line => (line === '' ? line : STACK_TRACE_COLOR(line)))
    .join('\n');

const isJestInternalFrame = (line: string) =>
  JEST_INTERNALS_IGNORE.test(line) ||
  (PATH_JEST_PACKAGES !== null && line.includes(PATH_JEST_PACKAGES));

const trim = (string: string) => (string || '').trim();

// Some errors contain not only line numbers in stack traces
// e.g. SyntaxErrors can contain snippets of code, and we don't
// want to trim those, because they may have pointers to the column/character
// which will get misaligned.
const trimPaths = (string: string) =>
  STACK_PATH_REGEXP.test(string) ? trim(string) : string;

const getRenderedCallsite = (
  fileContent: string,
  line: number,
  column?: number,
) => {
  let renderedCallsite = codeFrameColumns(
    fileContent,
    {start: {column, line}},
    {highlightCode: true},
  );

  renderedCallsite = indentAllLines(renderedCallsite);

  renderedCallsite = `\n${renderedCallsite}\n`;
  return renderedCallsite;
};

const blankStringRegexp = /^\s*$/;

function checkForCommonEnvironmentErrors(error: string) {
  if (
    error.includes('ReferenceError: document is not defined') ||
    error.includes('ReferenceError: window is not defined') ||
    error.includes('ReferenceError: navigator is not defined')
  ) {
    return warnAboutWrongTestEnvironment(error, 'jsdom');
  } else if (error.includes('.unref is not a function')) {
    return warnAboutWrongTestEnvironment(error, 'node');
  }

  return error;
}

function warnAboutWrongTestEnvironment(error: string, env: 'jsdom' | 'node') {
  return (
    chalk.bold.red(
      `The error below may be caused by using the wrong test environment, see ${chalk.dim.underline(
        'https://jestjs.io/docs/configuration#testenvironment-string',
      )}.\nConsider using the "${env}" test environment.\n\n`,
    ) + error
  );
}

const formatExecErrorWithSeen = (
  error: Error | TestResult.SerializableError | string | number | undefined,
  config: StackTraceConfig,
  options: StackTraceOptions,
  seen: Set<unknown>,
  testPath?: string,
  reuseMessage?: boolean,
  noTitle?: boolean,
): string => {
  if (!error || typeof error === 'number') {
    error = new Error(`Expected an Error, but "${String(error)}" was thrown`);
    error.stack = '';
  }

  let message, stack;
  let cause = '';
  const subErrors = [];

  if (typeof error === 'string' || !error) {
    error ||= 'EMPTY ERROR';
    message = '';
    stack = error;
  } else {
    message = error.message;
    stack =
      typeof error.stack === 'string'
        ? error.stack
        : `thrown: ${prettyFormat(error, {maxDepth: 3})}`;
    // Serialized errors from workers are plain objects, so cycle tracking must
    // cover any object, not just error-likes.
    seen.add(error);
    if ('cause' in error) {
      const prefix = '\n\nCause:\n';
      if (typeof error.cause === 'string' || typeof error.cause === 'number') {
        cause += `${prefix}${error.cause}`;
      } else if (isErrorLike(error.cause)) {
        const formatted = formatExecErrorWithSeen(
          markIfCircular(error.cause, 'cause', seen),
          config,
          options,
          seen,
          testPath,
          reuseMessage,
          true,
        );
        // The recursive call ends with a newline of its own; the seam owns
        // the spacing.
        cause += `${prefix}${formatted.trimEnd()}`;
      }
    }
    if ('errors' in error && Array.isArray(error.errors)) {
      for (const subError of error.errors) {
        subErrors.push(
          formatExecErrorWithSeen(
            seen.has(subError) ? '[Circular errors]' : subError,
            config,
            options,
            seen,
            testPath,
            reuseMessage,
            true,
          ),
        );
      }
    }
    seen.delete(error);
  }
  if (cause !== '') {
    cause = indentAllLines(cause);
  }

  const separated = separateMessageFromStack(stack || '');
  stack = separated.stack;

  if (separated.message.includes(trim(message))) {
    // Often stack trace already contains the duplicate of the message
    message = separated.message;
  }

  message = checkForCommonEnvironmentErrors(message);

  message = indentAllLines(message);

  const renderedStack =
    stack && !options.noStackTrace
      ? formatStackTrace(stack, config, options, testPath)
      : '';
  // A stack whose every frame was filtered out contributes nothing, not a
  // blank line.
  stack = renderedStack === '' ? '' : `\n${renderedStack}`;

  if (
    typeof stack !== 'string' ||
    (blankStringRegexp.test(message) && blankStringRegexp.test(stack))
  ) {
    // this can happen if an empty object is thrown.
    message = `thrown: ${prettyFormat(error, {maxDepth: 3})}`;
  }

  let messageToUse;

  if (reuseMessage || noTitle) {
    messageToUse = ` ${message.trim()}`;
  } else {
    messageToUse = `${EXEC_ERROR_MESSAGE}\n\n${message}`;
  }
  const title = noTitle ? '' : `${TITLE_INDENT + TITLE_BULLET}`;
  const subErrorStr =
    subErrors.length > 0
      ? indentAllLines(
          `\n\nErrors contained in AggregateError:\n${subErrors
            .map(subError => subError.trimEnd())
            .join('\n\n')}`,
        )
      : '';

  return `${title + messageToUse + stack + cause + subErrorStr}\n`;
};

// ExecError is an error thrown outside of the test suite (not inside an `it` or
// `before/after each` hooks). If it's thrown, none of the tests in the file
// are executed.
export const formatExecError = (
  error: Error | TestResult.SerializableError | string | number | undefined,
  config: StackTraceConfig,
  options: StackTraceOptions,
  testPath?: string,
  reuseMessage?: boolean,
  noTitle?: boolean,
): string =>
  formatExecErrorWithSeen(
    error,
    config,
    options,
    new Set(),
    testPath,
    reuseMessage,
    noTitle,
  );

const removeInternalStackEntries = (
  lines: Array<string>,
  options: StackTraceOptions,
): Array<string> => {
  let pathCounter = 0;

  return lines.filter(line => {
    if (!line) {
      return false;
    }

    if (ANONYMOUS_FN_IGNORE.test(line)) {
      return false;
    }

    if (ANONYMOUS_PROMISE_IGNORE.test(line)) {
      return false;
    }

    if (ANONYMOUS_GENERATOR_IGNORE.test(line)) {
      return false;
    }

    if (NATIVE_NEXT_IGNORE.test(line)) {
      return false;
    }

    if (nodeInternals.some(internal => internal.test(line))) {
      return false;
    }

    if (!STACK_PATH_REGEXP.test(line)) {
      return true;
    }

    if (JASMINE_IGNORE.test(line)) {
      return false;
    }

    if (++pathCounter === 1) {
      return true; // always keep the first line even if it's from Jest
    }

    if (options.noStackTrace) {
      return false;
    }

    if (isJestInternalFrame(line)) {
      return false;
    }

    return true;
  });
};

export const formatPath = (
  line: string,
  config: StackTraceConfig,
  relativeTestPath: string | null = null,
): string => {
  // Extract the file path from the trace line.
  const match = line.match(/(^\s*at .*?\(?)([^()]+)(:\d+:\d+\)?.*$)/);
  if (!match) {
    return line;
  }

  let filePath = slash(path.relative(config.rootDir, match[2]));
  // highlight paths from the current test file
  if (
    (config.testMatch &&
      config.testMatch.length > 0 &&
      picomatch(config.testMatch)(filePath)) ||
    filePath === relativeTestPath
  ) {
    filePath = chalk.reset.cyan(filePath);
  }
  return STACK_TRACE_COLOR(match[1]) + filePath + STACK_TRACE_COLOR(match[3]);
};

export function getStackTraceLines(
  stack: string,
  options?: StackTraceOptions,
): Array<string> {
  options = {noCodeFrame: false, noStackTrace: false, ...options};
  return removeInternalStackEntries(stack.split(/\n/), options);
}

export function getTopFrame(lines: Array<string>): Frame | null {
  for (const line of lines) {
    if (line.includes(PATH_NODE_MODULES) || isJestInternalFrame(line)) {
      continue;
    }

    const parsedFrame = stackUtils.parseLine(line.trim());

    if (parsedFrame && parsedFrame.file) {
      if (parsedFrame.file.startsWith('file://')) {
        parsedFrame.file = slash(fileURLToPath(parsedFrame.file));
      }
      return parsedFrame as Frame;
    }
  }

  return null;
}

// Renders the frames of a stack string: paths made relative, noisy internal
// frames dropped, and a code frame for the top frame. Takes the stack alone, so
// callers holding an error usually want `formatErrorStack` instead.
export function formatStackTrace(
  stack: string,
  config: StackTraceConfig,
  options: StackTraceOptions,
  testPath?: string,
): string {
  const lines = getStackTraceLines(stack, options);
  let renderedCallsite = '';
  const relativeTestPath = testPath
    ? slash(path.relative(config.rootDir, testPath))
    : null;

  if (!options.noStackTrace && !options.noCodeFrame) {
    const topFrame = getTopFrame(lines);
    if (topFrame) {
      const {column, file: filename, line} = topFrame;

      if (line && filename && path.isAbsolute(filename)) {
        let fileContent;
        try {
          // TODO: check & read HasteFS instead of reading the filesystem:
          // see: https://github.com/jestjs/jest/pull/5405#discussion_r164281696
          fileContent = fs.readFileSync(filename, 'utf8');
          renderedCallsite = getRenderedCallsite(fileContent, line, column);
        } catch {
          // the file does not exist or is inaccessible, we ignore
        }
      }
    }
  }

  const stacktrace =
    lines.length === 0
      ? ''
      : `\n${lines
          .map(
            line =>
              STACK_INDENT +
              formatPath(trimPaths(line), config, relativeTestPath),
          )
          .join('\n')}`;

  return renderedCallsite + stacktrace;
}

type FailedResults = Array<{
  /** Stringified version of the error */
  content: string;
  /** Details related to the failure */
  failureDetails: unknown;
  /** Execution result */
  result: TestResult.AssertionResult;
}>;

/* `isError` is used, because the error might come from another realm.
 `instanceof Error` is used because `isError` does return `false` for some
 things that are `instanceof Error` like the errors provided in
 [verror](https://www.npmjs.com/package/verror) or
 [axios](https://axios-http.com).
*/
function isErrorLike(error: unknown): error is Error {
  return isError(error) || error instanceof Error;
}

function isErrorOrStackWithCause(
  errorOrStack: Error | string,
): errorOrStack is Error & {cause: Error | string} {
  return (
    typeof errorOrStack !== 'string' &&
    'cause' in errorOrStack &&
    (typeof errorOrStack.cause === 'string' || isErrorLike(errorOrStack.cause))
  );
}

function toErrorOrStack(value: unknown): Error | string {
  return typeof value === 'string' || isErrorLike(value)
    ? value
    : `thrown: ${prettyFormat(value, {maxDepth: 3})}`;
}

function isErrorOrStackWithErrors(
  errorOrStack: Error | string,
): errorOrStack is Error & {errors: Array<unknown>} {
  return (
    typeof errorOrStack !== 'string' &&
    'errors' in errorOrStack &&
    Array.isArray(errorOrStack.errors)
  );
}

// Whether an error carries anything the flattener would append: a `cause` (an
// error or a plain string) or a non-empty `AggregateError.errors`.
export function hasNestedErrors(value: unknown): value is Error {
  return (
    isErrorLike(value) &&
    (isErrorOrStackWithCause(value) ||
      (isErrorOrStackWithErrors(value) && value.errors.length > 0))
  );
}

// Replaces an error already on the current ancestor path with a marker, so a
// cyclic `cause` or a self-referential `AggregateError` terminates.
function markIfCircular(
  value: Error | string,
  kind: 'cause' | 'errors',
  seen: ReadonlySet<unknown>,
): Error | string {
  return typeof value === 'string' || !seen.has(value)
    ? value
    : `[Circular ${kind}]`;
}

function flattenErrorStackWithSeen(
  errorOrStack: Error | string,
  seen: Set<Error>,
): string {
  if (typeof errorOrStack === 'string') {
    return errorOrStack;
  }

  const {message, stack} = errorOrStack;
  let flattened;
  if (typeof stack === 'string' && stack !== '') {
    // Some errors (e.g. Angular injection errors) don't embed the message in
    // the stack; prepend it so it isn't lost.
    flattened =
      message && !stack.includes(message)
        ? message + stack.replace(/^Error:?\s*\n/, '\n')
        : stack;
  } else {
    flattened = message;
  }

  // Tracks the current ancestor path rather than everything already visited, so
  // that repeating the same error across sibling branches is not a cycle.
  seen.add(errorOrStack);

  if (isErrorOrStackWithCause(errorOrStack)) {
    const cause = markIfCircular(errorOrStack.cause, 'cause', seen);
    flattened += `\n\n[cause]: ${flattenErrorStackWithSeen(cause, seen)}`;
  }

  if (isErrorOrStackWithErrors(errorOrStack)) {
    for (const error of errorOrStack.errors) {
      const nested = markIfCircular(toErrorOrStack(error), 'errors', seen);
      flattened += `\n\n[errors]: ${flattenErrorStackWithSeen(nested, seen)}`;
    }
  }

  seen.delete(errorOrStack);

  return flattened;
}

// Flattens an error, its `cause` chain and any `AggregateError` entries into one
// plain string. Unlike the `format*` renderers this carries no colour or code
// frames, because it feeds `--json` output and reporter annotations.
export function flattenErrorStack(error: Error): string {
  return flattenErrorStackWithSeen(error, new Set());
}

function formatErrorStackWithSeen(
  errorOrStack: Error | string,
  config: StackTraceConfig,
  options: StackTraceOptions,
  seen: Set<Error>,
  testPath?: string,
): string {
  // The stack of new Error('message') contains both the message and the stack,
  // thus we need to sanitize and clean it for proper display using
  // separateMessageFromStack. An error whose stack was blanked still has its
  // message, which is better than rendering nothing.
  const sourceStack =
    typeof errorOrStack === 'string'
      ? errorOrStack
      : errorOrStack.stack || errorOrStack.message || '';
  let {message, stack} = separateMessageFromStack(sourceStack);
  const renderedStack = options.noStackTrace
    ? ''
    : colorStackLines(formatStackTrace(stack, config, options, testPath));
  // A stack whose every frame was filtered out contributes nothing, not a
  // blank line.
  stack = renderedStack === '' ? '' : `${renderedStack}\n`;

  message = checkForCommonEnvironmentErrors(message);
  message = indentAllLines(message);

  if (typeof errorOrStack !== 'string') {
    seen.add(errorOrStack);
  }

  let cause = '';
  if (isErrorOrStackWithCause(errorOrStack)) {
    const nestedCause = formatErrorStackWithSeen(
      markIfCircular(errorOrStack.cause, 'cause', seen),
      config,
      options,
      seen,
      testPath,
    );
    cause = indentAllLines(`\nCause:\n${nestedCause}`);
  }

  let subErrors = '';
  if (
    isErrorOrStackWithErrors(errorOrStack) &&
    errorOrStack.errors.length > 0
  ) {
    const nestedErrors = errorOrStack.errors.map(error =>
      formatErrorStackWithSeen(
        markIfCircular(toErrorOrStack(error), 'errors', seen),
        config,
        options,
        seen,
        testPath,
      ),
    );

    subErrors = indentAllLines(
      `\nErrors contained in AggregateError:\n${nestedErrors.join('\n')}`,
    );
  }

  if (typeof errorOrStack !== 'string') {
    seen.delete(errorOrStack);
  }

  return `${message}\n${stack}${cause}${subErrors}`;
}

// Renders a single error the way a test failure is rendered inside
// `formatResultsErrors`: message, coloured stack with code frame, and nested
// `Cause:` / `Errors contained in AggregateError:` sections.
export function formatErrorStack(
  errorOrStack: Error | string,
  config: StackTraceConfig,
  options: StackTraceOptions,
  testPath?: string,
): string {
  return formatErrorStackWithSeen(
    errorOrStack,
    config,
    options,
    new Set(),
    testPath,
  );
}

function failureDetailsToErrorOrStack(
  failureDetails: unknown,
  content: string,
): Error | string {
  if (!failureDetails) {
    return content;
  }
  if (isErrorLike(failureDetails)) {
    return failureDetails; // receiving raw errors for jest-circus
  }
  if (
    typeof failureDetails === 'object' &&
    'error' in failureDetails &&
    isErrorLike(failureDetails.error)
  ) {
    return failureDetails.error; // receiving instances of FailedAssertion for jest-jasmine
  }
  return content;
}

export const formatResultsErrors = (
  testResults: Array<TestResult.AssertionResult>,
  config: StackTraceConfig,
  options: StackTraceOptions,
  testPath?: string,
): string | null => {
  const failedResults: FailedResults = testResults.flatMap(result =>
    result.failureMessages.map((item, index) => ({
      content: item,
      failureDetails: result.failureDetails[index],
      result,
    })),
  );

  if (failedResults.length === 0) {
    return null;
  }

  return failedResults
    .map(({result, content, failureDetails}) => {
      const rootErrorOrStack = failureDetailsToErrorOrStack(
        failureDetails,
        content,
      );

      const title = `${chalk.bold.red(
        TITLE_INDENT +
          TITLE_BULLET +
          result.ancestorTitles.join(ANCESTRY_SEPARATOR) +
          (result.ancestorTitles.length > 0 ? ANCESTRY_SEPARATOR : '') +
          result.title,
      )}\n`;

      return `${title}\n${formatErrorStackWithSeen(
        rootErrorOrStack,
        config,
        options,
        new Set(),
        testPath,
      )}`;
    })
    .join('\n');
};

const errorRegexp = /^Error:?\s*$/;

const removeBlankErrorLine = (str: string) =>
  str
    .split('\n')
    // Lines saying just `Error:` are useless
    .filter(line => !errorRegexp.test(line))
    .join('\n')
    .trimEnd();

// jasmine and worker farm sometimes don't give us access to the actual
// Error object, so we have to regexp out the message from the stack string
// to format it.
export const separateMessageFromStack = (
  content: string,
): {message: string; stack: string} => {
  if (!content) {
    return {message: '', stack: ''};
  }

  // All lines up to what looks like a stack -- or if nothing looks like a stack
  // (maybe it's a code frame instead), just the first non-empty line.
  // If the error is a plain "Error:" instead of a SyntaxError or TypeError we
  // remove the prefix from the message because it is generally not useful.
  const messageMatch = content.match(
    /^(?:Error: )?([\S\s]*?(?=\n\s*at\s.*:\d*:\d*)|\s*.*)([\S\s]*)$/,
  );
  if (!messageMatch) {
    // For typescript
    throw new Error('If you hit this error, the regex above is buggy.');
  }
  const message = removeBlankErrorLine(messageMatch[1]);
  const stack = removeBlankErrorLine(messageMatch[2]);
  return {message, stack};
};
