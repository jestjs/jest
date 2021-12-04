/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ErrorChainNode,
  ErrorNode,
  FrameNode,
  getAbsoluteSitePath,
  isError,
  isInternalFrame as isNodeInternalFrame,
  parseError,
  parseErrors,
  parseFrame,
  printNode,
} from '@stack-tools/node-tools';
import chalk = require('chalk');
import type {Config, TestResult} from '@jest/types';
import {format as prettyFormat} from 'pretty-format';
import type {Frame} from './types';
import {
  JestVisitor,
  JestVisitorOptions,
  getTopFrame as __getTopFrame,
} from './visitor';

export type {Frame};

type Path = Config.Path;

export type StackTraceConfig = Pick<
  Config.ProjectConfig,
  'rootDir' | 'testMatch'
>;

export type StackTraceOptions = {
  noStackTrace?: boolean;
  noCodeFrame?: boolean;
  indentHeader?: string;
  indentFrames?: string;
};

// filter for noisy stack trace lines
const ANCESTRY_SEPARATOR = ' \u203A ';
const TITLE_BULLET = chalk.bold('\u25cf ');
const EXEC_ERROR_MESSAGE = 'Test suite failed to run';
const NOT_EMPTY_LINE_REGEXP = /^(?!$)/gm;

export const indentLines = (lines: string, indent: string = '  '): string =>
  lines.replace(NOT_EMPTY_LINE_REGEXP, indent);

function getWrongEnvironmentWarning(error: ErrorNode) {
  if (error.message) {
    const {message} = error.message;
    let considerEnv: 'jsdom' | 'node' | undefined;
    if (
      (error.name?.name === 'ReferenceError' &&
        message.includes('document is not defined')) ||
      message.includes('window is not defined') ||
      message.includes('navigator is not defined')
    ) {
      considerEnv = 'jsdom';
    } else if (message.includes('.unref is not a function')) {
      considerEnv = 'node';
    }
    if (considerEnv) {
      return chalk.bold.red(
        `The error below may be caused by using the wrong test environment, see ${chalk.dim.underline(
          'https://jestjs.io/docs/configuration#testenvironment-string',
        )}.\nConsider using the "${considerEnv}" test environment.`,
      );
    }
  }

  return undefined;
}

const cleanFrames = (
  frames: Array<FrameNode> | undefined,
  options: StackTraceOptions = {},
): Array<FrameNode> => {
  let frames_ = frames || [];
  frames_ = frames_.filter(frame => !isInternalFrame(frame));

  const firstFrame = frames_[0];

  frames_ = frames_.filter(frame => !isJestInternalFrame(frame));

  if (!firstFrame && !frames_.length) {
    frames_ = [{type: 'OmittedFrame'}];
  } else if (firstFrame) {
    // always keep the first frame even if it's from Jest
    if (!frames_.length || options.noStackTrace) {
      frames_ = [firstFrame];
    } else if (firstFrame !== frames_[0]) {
      frames_.unshift(firstFrame);
    }
  }

  return frames_;
};

const cleanErrors = (
  errors: ErrorChainNode,
  options: StackTraceOptions = {},
): ErrorChainNode => {
  for (const error of errors.errors) {
    if (error.frames) {
      error.frames = cleanFrames(error.frames, options);
    }
  }
  return errors;
};

const isJestInternalFrame = (frame: FrameNode) => {
  if (frame.type !== 'CallSiteFrame') {
    return false;
  } else {
    const absPath = getAbsoluteSitePath(frame);
    return absPath
      ? /\/jest[^/]*\/(build|node_modules|packages)\//.test(absPath)
      : false;
  }
};

const isInternalFrame = (frame: FrameNode) => {
  if (frame.type !== 'CallSiteFrame') {
    return false;
  }

  const {call, site} = frame.callSite;

  if (call) {
    if (call.function === '<anonymous>') {
      return true;
    }

    if (call.function === 'Promise' && site.type === 'AnonymousSite') {
      return true;
    }

    if (call.function === 'Generator.next' && site.type === 'AnonymousSite') {
      return true;
    }

    if (call.function === 'next' && site.type === 'NativeSite') {
      return true;
    }
  }

  if (isNodeInternalFrame(site)) {
    return true;
  }

  if (call && call.function.startsWith('jasmine')) {
    return true;
  }

  return false;
};

const buildVisitorOptions = (
  config: StackTraceConfig,
  options: StackTraceOptions = {},
  relativeTestPath: Path | null = null,
): JestVisitorOptions => {
  const {rootDir, testMatch} = config;
  const {
    noStackTrace = false,
    noCodeFrame = false,
    indentHeader = '    ',
    indentFrames = '    ',
  } = options;
  return {
    frames: !noStackTrace,
    indentFrames,
    indentHeader,
    noCodeFrame: noStackTrace || noCodeFrame,
    noStackTrace,
    relativeTestPath,
    rootDir,
    testMatch,
  };
};

export const getStackTraceLines = (
  frames: string,
  options: StackTraceOptions = {noCodeFrame: false, noStackTrace: false},
): Array<string> => {
  const parsedError = parseError(frames);

  parsedError.frames = cleanFrames(parsedError.frames, options);

  return parsedError.frames
    ? parsedError.frames.map(frame => printNode(frame)!)
    : [];
};

export const formatStackTrace = (
  error: string | ErrorNode,
  config: StackTraceConfig,
  options?: StackTraceOptions,
  testPath?: Path,
): string => {
  const visitorOptions = {
    ...buildVisitorOptions(config, options, testPath),
    frames: true,
    indentFrames: '    ',
    indentHeader: '',
  };
  const parsedError = typeof error === 'string' ? parseError(error) : error;

  parsedError.frames = cleanFrames(parsedError.frames, options);

  return '\n' + JestVisitor.visit(parsedError, visitorOptions) || '';
};

export const getTopFrame = (frames: Array<string>): Frame | null => {
  const frameNode = __getTopFrame(frames.map(frame => parseFrame(frame)));
  const site = frameNode?.callSite?.site || null;

  return (
    site && {
      column: site.position.column,
      file: site.locator.path,
      line: site.position.line,
    }
  );
};

// ExecError is an error thrown outside of the test suite (not inside an `it` or
// `before/after each` hooks). If it's thrown, none of the tests in the file
// are executed.
export const formatExecError = (
  error: Error | TestResult.SerializableError | string | undefined,
  config: StackTraceConfig,
  options: StackTraceOptions = {},
  testPath?: Path,
  reuseMessage?: boolean,
): string => {
  if (!error || typeof error === 'number') {
    error = {
      message: `Expected an Error, but "${String(error)}" was thrown`,
      stack: '',
    };
  }

  let parsedErrors;
  let printed;

  try {
    if (typeof error === 'string') {
      parsedErrors = parseErrors(error);
    } else if (isError(error)) {
      parsedErrors = parseErrors(error);
    } else if (error.stack) {
      parsedErrors = parseErrors(error.stack);
      const topError = parsedErrors.errors[0];
      if (error.message && !topError.name && !topError.message) {
        parsedErrors.errors[0] = {
          ...parseError(error.message),
          frames: topError.frames,
        };
      }
    } else if (error.message) {
      parsedErrors = parseErrors(error.message);
    }
  } catch (e: unknown) {}

  if (parsedErrors) {
    const topError = parsedErrors.errors[0];
    const envWarning = topError && getWrongEnvironmentWarning(topError);

    cleanErrors(parsedErrors, options);

    const visitorOptions = buildVisitorOptions(config, options, testPath);
    const printedErrors = JestVisitor.visit(parsedErrors, visitorOptions) || '';

    printed = envWarning
      ? `${indentLines(envWarning, '    ')}\n\n${printedErrors}`
      : printedErrors;

    if (reuseMessage)
      printed = printed.slice(visitorOptions.indentHeader.length);
  } else {
    printed = indentLines(
      `thrown: ${prettyFormat(error, {maxDepth: 3})}`,
      '      ',
    ).slice(2);
  }

  const title = reuseMessage ? ' ' : `${EXEC_ERROR_MESSAGE}\n\n`;

  return `  ${TITLE_BULLET}${title}${printed}\n`;
};

type FailedResults = Array<{
  content: string;
  result: TestResult.AssertionResult;
}>;

export const formatResultsErrors = (
  testResults: Array<TestResult.AssertionResult>,
  config: StackTraceConfig,
  options: StackTraceOptions = {},
  testPath?: Path,
): string | null => {
  const visitorOptions = {
    ...buildVisitorOptions(config, options, testPath),
    indentFrames: '    ',
    indentHeader: '    ',
  };

  const failedResults: FailedResults = testResults.reduce<FailedResults>(
    (errors, result) => {
      result.failureMessages.forEach(item => {
        errors.push({content: item, result});
      });
      return errors;
    },
    [],
  );

  if (!failedResults.length) {
    return null;
  }

  return failedResults
    .map(({result, content}) => {
      let error;
      let printed;
      try {
        error = parseError(content);

        const envWarning = error && getWrongEnvironmentWarning(error);

        if (error.frames) {
          error.frames = cleanFrames(error.frames, options);
        }

        const printedError = JestVisitor.visit(error, visitorOptions);

        printed = envWarning
          ? `${indentLines(envWarning, '    ')}\n\n${printedError}`
          : printedError;
      } catch (e: unknown) {
        printed = content;
      }

      const title =
        chalk.bold.red(
          '  ' +
            TITLE_BULLET +
            result.ancestorTitles.join(ANCESTRY_SEPARATOR) +
            (result.ancestorTitles.length ? ANCESTRY_SEPARATOR : '') +
            result.title,
        ) + '\n';

      return title + '\n' + printed + '\n';
    })
    .join('\n');
};
