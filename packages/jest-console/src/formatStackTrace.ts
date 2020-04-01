/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * This is a temporary file to prevent breaking change
 * TODO: 
 * 1) move formatResultErrors to jest-test-result so that jest-message-util no
 *    longer depends on jest-test-result
 * 2) make jest-console depend on jest-message-util
 * 3) remove this file
 */

import * as fs from 'fs';
import * as path from 'path';
import type {Config} from '@jest/types';
import chalk = require('chalk');
import micromatch = require('micromatch');
import slash = require('slash');
import {codeFrameColumns} from '@babel/code-frame';
import StackUtils = require('stack-utils');


export interface Frame extends StackUtils.StackData {
  file: string;
}

type Path = Config.Path;

// stack utils tries to create pretty stack by making paths relative.
const stackUtils = new StackUtils({cwd: 'something which does not exist'});

let nodeInternals: Array<RegExp> = [];

try {
  nodeInternals = StackUtils.nodeInternals();
} catch (e) {
  // `StackUtils.nodeInternals()` fails in browsers. We don't need to remove
  // node internals in the browser though, so no issue.
}

export type StackTraceConfig = Pick<
  Config.ProjectConfig,
  'rootDir' | 'testMatch'
>;

export type StackTraceOptions = {
  noStackTrace: boolean;
};

const PATH_NODE_MODULES = `${path.sep}node_modules${path.sep}`;
const PATH_JEST_PACKAGES = `${path.sep}jest${path.sep}packages${path.sep}`;

// filter for noisy stack trace lines
const JASMINE_IGNORE = /^\s+at(?:(?:.jasmine\-)|\s+jasmine\.buildExpectationResult)/;
const JEST_INTERNALS_IGNORE = /^\s+at.*?jest(-.*?)?(\/|\\)(build|node_modules|packages)(\/|\\)/;
const ANONYMOUS_FN_IGNORE = /^\s+at <anonymous>.*$/;
const ANONYMOUS_PROMISE_IGNORE = /^\s+at (new )?Promise \(<anonymous>\).*$/;
const ANONYMOUS_GENERATOR_IGNORE = /^\s+at Generator.next \(<anonymous>\).*$/;
const NATIVE_NEXT_IGNORE = /^\s+at next \(native\).*$/;
const MESSAGE_INDENT = '    ';
const STACK_INDENT = '      ';
const STACK_TRACE_COLOR = chalk.dim;
const STACK_PATH_REGEXP = /\s*at.*\(?(\:\d*\:\d*|native)\)?/;
const NOT_EMPTY_LINE_REGEXP = /^(?!$)/gm;

const indentAllLines = (lines: string, indent: string) =>
  lines.replace(NOT_EMPTY_LINE_REGEXP, indent);

const trim = (string: string) => (string || '').trim();

// Some errors contain not only line numbers in stack traces
// e.g. SyntaxErrors can contain snippets of code, and we don't
// want to trim those, because they may have pointers to the column/character
// which will get misaligned.
const trimPaths = (string: string) =>
  string.match(STACK_PATH_REGEXP) ? trim(string) : string;

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

  renderedCallsite = indentAllLines(renderedCallsite, MESSAGE_INDENT);

  renderedCallsite = `\n${renderedCallsite}\n`;
  return renderedCallsite;
};



const removeInternalStackEntries = (
  lines: Array<string>,
  options: StackTraceOptions,
): Array<string> => {
  let pathCounter = 0;

  return lines.filter(line => {
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

    if (JEST_INTERNALS_IGNORE.test(line)) {
      return false;
    }

    return true;
  });
};

const formatPaths = (
  config: StackTraceConfig,
  relativeTestPath: Path | null,
  line: string,
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
      micromatch([filePath], config.testMatch).length > 0) ||
    filePath === relativeTestPath
  ) {
    filePath = chalk.reset.cyan(filePath);
  }
  return STACK_TRACE_COLOR(match[1]) + filePath + STACK_TRACE_COLOR(match[3]);
};

export const getStackTraceLines = (
  stack: string,
  options: StackTraceOptions = {noStackTrace: false},
): Array<string> => removeInternalStackEntries(stack.split(/\n/), options);

export const getTopFrame = (lines: Array<string>): Frame | null => {
  for (const line of lines) {
    if (line.includes(PATH_NODE_MODULES) || line.includes(PATH_JEST_PACKAGES)) {
      continue;
    }

    const parsedFrame = stackUtils.parseLine(line.trim());

    if (parsedFrame && parsedFrame.file) {
      return parsedFrame as Frame;
    }
  }

  return null;
};

export const formatStackTrace = (
  stack: string,
  config: StackTraceConfig,
  options: StackTraceOptions,
  testPath?: Path,
): string => {
  const lines = getStackTraceLines(stack, options);
  const topFrame = getTopFrame(lines);
  let renderedCallsite = '';
  const relativeTestPath = testPath
    ? slash(path.relative(config.rootDir, testPath))
    : null;

  if (topFrame) {
    const {column, file: filename, line} = topFrame;

    if (line && filename && path.isAbsolute(filename)) {
      let fileContent;
      try {
        // TODO: check & read HasteFS instead of reading the filesystem:
        // see: https://github.com/facebook/jest/pull/5405#discussion_r164281696
        fileContent = fs.readFileSync(filename, 'utf8');
        renderedCallsite = getRenderedCallsite(fileContent, line, column);
      } catch (e) {
        // the file does not exist or is inaccessible, we ignore
      }
    }
  }

  const stacktrace = lines
    .filter(Boolean)
    .map(
      line =>
        STACK_INDENT + formatPaths(config, relativeTestPath, trimPaths(line)),
    )
    .join('\n');

  return `${renderedCallsite}\n${stacktrace}`;
};



const errorRegexp = /^Error:?\s*$/;

export const removeBlankErrorLine = (str: string) =>
  str
    .split('\n')
    // Lines saying just `Error:` are useless
    .filter(line => 
        !errorRegexp.test(line))
    .join('\n')
    .trimRight();

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
    /^(?:Error: )?([\s\S]*?(?=\n\s*at\s.*:\d*:\d*)|\s*.*)([\s\S]*)$/,
  );
  if (!messageMatch) {
    // For typescript
    throw new Error('If you hit this error, the regex above is buggy.');
  }
  const message = removeBlankErrorLine(messageMatch[1]);
  const stack = removeBlankErrorLine(messageMatch[2]);
  return {message, stack};
};
