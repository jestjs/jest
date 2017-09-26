/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import chalk from 'chalk';
import {diffLines, structuredPatch} from 'diff';

import {NO_DIFF_MESSAGE} from './constants.js';
const DIFF_CONTEXT_DEFAULT = 5;

export type DiffOptions = {|
  aAnnotation?: string,
  bAnnotation?: string,
  expand?: boolean,
  contextLines?: number,
|};

type Original = {|
  a: string,
  b: string,
|};

type Diff = string | null;

type Hunk = {|
  lines: Array<string>,
  newLines: number,
  newStart: number,
  oldLines: number,
  oldStart: number,
|};

type DIFF_DIGIT = -1 | 1 | 0; // removed | added | equal

// Given diff digit, return array which consists of:
// if compared line is removed or added: corresponding original line
// if compared line is equal: original received and expected lines
type GetOriginal = (digit: DIFF_DIGIT) => Array<string>;

// Given chunk, return diff character.
const getDiffChar = (chunk): string =>
  chunk.removed ? '-' : chunk.added ? '+' : ' ';

// Given diff character in line of hunk or computed from properties of chunk.
const getDiffDigit = (char: string): DIFF_DIGIT =>
  char === '-' ? -1 : char === '+' ? 1 : 0;

// Color for text of line.
const getColor = (digit: DIFF_DIGIT, onlyIndentationChanged?: boolean) => {
  if (digit === -1) {
    return chalk.green; // removed
  }
  if (digit === 1) {
    return chalk.red; // added
  }
  return onlyIndentationChanged ? chalk.cyan : chalk.dim;
};

// Do NOT color leading or trailing spaces if original lines are equal:

// Background color for leading or trailing spaces.
const getBgColor = (digit: DIFF_DIGIT) => {
  if (digit === -1) {
    return chalk.bgGreen; // removed
  }
  if (digit === 1) {
    return chalk.bgRed; // added
  }
  return chalk.bgCyan; // only indentation changed
};

// ONLY trailing if expected value is snapshot or multiline string.
const highlightTrailingWhitespace = (line: string, bgColor: Function): string =>
  line.replace(/\s+$/, bgColor('$&'));

// BOTH leading AND trailing if expected value is data structure.
const highlightWhitespace = (line: string, bgColor: Function): string =>
  highlightTrailingWhitespace(line.replace(/^\s+/, bgColor('$&')), bgColor);

const getAnnotation = (options: ?DiffOptions): string =>
  chalk.green('- ' + ((options && options.aAnnotation) || 'Expected')) +
  '\n' +
  chalk.red('+ ' + ((options && options.bAnnotation) || 'Received')) +
  '\n\n';

// Given string, return array of its lines.
const splitIntoLines = string => {
  const lines = string.split('\n');

  if (lines.length !== 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines;
};

// Given diff character and compared line, return original line with colors.
const formatLine = (
  char: string,
  lineCompared: string,
  getOriginal?: GetOriginal,
) => {
  const digit = getDiffDigit(char);

  if (getOriginal) {
    // Compared without indentation if expected value is data structure.
    const lineArray = getOriginal(digit);
    const lineOriginal = lineArray[0];
    const onlyIndentationChanged =
      digit === 0 && lineOriginal.length !== lineArray[1].length;

    return getColor(digit, onlyIndentationChanged)(
      char +
        ' ' +
        // Prepend indentation spaces from original to compared line.
        lineOriginal.slice(0, lineOriginal.length - lineCompared.length) +
        (digit !== 0 || onlyIndentationChanged
          ? highlightWhitespace(lineCompared, getBgColor(digit))
          : lineCompared),
    );
  }

  // Format compared line when expected is snapshot or multiline string.
  return getColor(digit)(
    char +
      ' ' +
      (digit !== 0
        ? highlightTrailingWhitespace(lineCompared, getBgColor(digit))
        : lineCompared),
  );
};

// Given original lines, return callback function
// which given diff digit, returns array.
const getterForChunks = (original: Original) => {
  const linesExpected = splitIntoLines(original.a);
  const linesReceived = splitIntoLines(original.b);

  let iExpected = 0;
  let iReceived = 0;

  return (digit: DIFF_DIGIT) => {
    if (digit === -1) {
      return [linesExpected[iExpected++]];
    }
    if (digit === 1) {
      return [linesReceived[iReceived++]];
    }
    // Because compared line is equal: original received and expected lines.
    return [linesReceived[iReceived++], linesExpected[iExpected++]];
  };
};

// jest --expand
const formatChunks = (a: string, b: string, original?: Original): Diff => {
  const chunks = diffLines(a, b);
  if (chunks.every(chunk => !chunk.removed && !chunk.added)) {
    return null;
  }

  const getOriginal = original && getterForChunks(original);
  return chunks
    .reduce((lines, chunk) => {
      const char = getDiffChar(chunk);

      splitIntoLines(chunk.value).forEach(line => {
        lines.push(formatLine(char, line, getOriginal));
      });

      return lines;
    }, [])
    .join('\n');
};

// Only show patch marks ("@@ ... @@") if the diff is big.
// To determine this, we need to compare either the original string (a) to
// `hunk.oldLines` or a new string to `hunk.newLines`.
// If the `oldLinesCount` is greater than `hunk.oldLines`
// we can be sure that at least 1 line has been "hidden".
const shouldShowPatchMarks = (hunk: Hunk, oldLinesCount: number): boolean =>
  oldLinesCount > hunk.oldLines;

const createPatchMark = (hunk: Hunk): string => {
  const markOld = `-${hunk.oldStart},${hunk.oldLines}`;
  const markNew = `+${hunk.newStart},${hunk.newLines}`;
  return chalk.yellow(`@@ ${markOld} ${markNew} @@`);
};

// Given original lines, return callback function which given indexes for hunk,
// returns another callback function which given diff digit, returns array.
const getterForHunks = (original: Original) => {
  const linesExpected = splitIntoLines(original.a);
  const linesReceived = splitIntoLines(original.b);

  return (iExpected: number, iReceived: number) => (digit: DIFF_DIGIT) => {
    if (digit === -1) {
      return [linesExpected[iExpected++]];
    }
    if (digit === 1) {
      return [linesReceived[iReceived++]];
    }
    // Because compared line is equal: original received and expected lines.
    return [linesReceived[iReceived++], linesExpected[iExpected++]];
  };
};

// jest --no-expand
const formatHunks = (
  a: string,
  b: string,
  contextLines?: number,
  original?: Original,
): Diff => {
  const options = {
    context:
      typeof contextLines === 'number' && contextLines >= 0
        ? contextLines
        : DIFF_CONTEXT_DEFAULT,
  };

  const {hunks} = structuredPatch('', '', a, b, '', '', options);
  if (hunks.length === 0) {
    return null;
  }

  const getter = original && getterForHunks(original);
  const oldLinesCount = (a.match(/\n/g) || []).length;
  return hunks
    .reduce((lines, hunk: Hunk) => {
      if (shouldShowPatchMarks(hunk, oldLinesCount)) {
        lines.push(createPatchMark(hunk));
      }

      // Hunk properties are one-based but index args are zero-based.
      const getOriginal =
        getter && getter(hunk.oldStart - 1, hunk.newStart - 1);
      hunk.lines.forEach(line => {
        lines.push(formatLine(line[0], line.slice(1), getOriginal));
      });

      return lines;
    }, [])
    .join('\n');
};

export default function diffStrings(
  a: string,
  b: string,
  options: ?DiffOptions,
  original?: Original,
): string {
  // Because `formatHunks` and `formatChunks` ignore one trailing newline,
  // always append newline to strings:
  a += '\n';
  b += '\n';

  // `diff` uses the Myers LCS diff algorithm which runs in O(n+d^2) time
  // (where "d" is the edit distance) and can get very slow for large edit
  // distances. Mitigate the cost by switching to a lower-resolution diff
  // whenever linebreaks are involved.
  const result =
    options && options.expand === false
      ? formatHunks(a, b, options && options.contextLines, original)
      : formatChunks(a, b, original);

  return result === null ? NO_DIFF_MESSAGE : getAnnotation(options) + result;
}
