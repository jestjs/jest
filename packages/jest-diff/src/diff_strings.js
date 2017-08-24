/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

export type Original = {|
  a: string,
  b: string,
|};

type Diff = {diff: string, isDifferent: boolean};

type Hunk = {|
  lines: Array<string>,
  newLines: number,
  newStart: number,
  oldLines: number,
  oldStart: number,
|};

type DIFF_D = -1 | 1 | 0; // diff digit: removed | added | equal

// Given chunk, return diff character.
const getC = (chunk): string => (chunk.removed ? '-' : chunk.added ? '+' : ' ');

// Given diff character by getC from chunk or line from hunk, return diff digit.
const getD = (c: string): DIFF_D => (c === '-' ? -1 : c === '+' ? 1 : 0);

// Color for text of line.
// If compared lines are equal and expected and received are data structures,
// then delta is difference in length of original lines.
const getColor = (d: DIFF_D, delta?: number) =>
  d === 1 ? chalk.red : d === -1 ? chalk.green : delta ? chalk.cyan : chalk.dim;

// Do NOT color leading or trailing spaces if original lines are equal:

// Background color for leading or trailing spaces.
const getBgColor = (d: DIFF_D) =>
  d === 1 ? chalk.bgRed : d === -1 ? chalk.bgGreen : chalk.bgCyan;

// ONLY trailing if expected is snapshot or multiline string.
const highlightTrailingWhitespace = (line: string, bgColor: Function): string =>
  line.replace(/\s+$/, bgColor('$&'));

// BOTH leading AND trailing if expected and received are data structures.
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

// Given diff character and corresponding compared line, return line with colors
// and original indentation if compared with `indent: 0` option.
const formatLine = (
  c: string,
  lineCompared: string,
  getOriginal?: Function,
) => {
  const d = getD(c);

  if (getOriginal) {
    // getOriginal callback function if expected and received are data structures.
    const gotOriginal = getOriginal(d);
    const lineOriginal = d === 0 ? gotOriginal[1] : gotOriginal;
    const lengthOriginal = lineOriginal.length;
    // If compared lines are equal,
    // then delta is difference in length of original lines.
    const delta = d === 0 ? lengthOriginal - gotOriginal[0].length : 0;
    return getColor(d, delta)(
      c +
        // Line was compared without its original indentation.
        lineOriginal.slice(0, lengthOriginal - lineCompared.length) +
        (d === 0 && delta === 0
          ? lineCompared
          : highlightWhitespace(lineCompared, getBgColor(d))),
    );
  }

  // Format compared line when expected is snapshot or multiline string.
  return getColor(d)(
    c +
      (d === 0
        ? lineCompared
        : highlightTrailingWhitespace(lineCompared, getBgColor(d))),
  );
};

// Given original lines, return callback function which given diff digit,
// returns either the corresponding expected OR received line,
// or if compared lines are equal, array of expected AND received line.
const getterForChunks = (original: Original) => {
  const linesExpected = splitIntoLines(original.a);
  const linesReceived = splitIntoLines(original.b);

  let indexExpected = 0;
  let indexReceived = 0;

  return (d: DIFF_D) =>
    d === -1
      ? linesExpected[indexExpected++]
      : d === 1
        ? linesReceived[indexReceived++]
        : [linesExpected[indexExpected++], linesReceived[indexReceived++]];
};

const formatChunks = (a: string, b: string, original?: Original): Diff => {
  const getOriginal = original && getterForChunks(original);
  let isDifferent = false;

  return {
    diff: diffLines(a, b)
      .map(chunk => {
        const {added, removed, value} = chunk;
        if (added || removed) {
          isDifferent = true;
        }
        const c = getC(chunk);

        return splitIntoLines(value)
          .map(line => formatLine(c, line, getOriginal))
          .join('\n');
      })
      .join('\n'),
    isDifferent,
  };
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
  return chalk.yellow(`@@ ${markOld} ${markNew} @@\n`);
};

// Given original lines, return callback function which given indexes for hunk,
// returns another callback function which given diff digit,
// returns either the corresponding expected OR received line,
// or if compared lines are equal, array of expected AND received line.
const getterForHunks = (original: Original) => {
  const linesExpected = splitIntoLines(original.a);
  const linesReceived = splitIntoLines(original.b);

  return (indexExpected: number, indexReceived: number) => (d: DIFF_D) =>
    d === -1
      ? linesExpected[indexExpected++]
      : d === 1
        ? linesReceived[indexReceived++]
        : [linesExpected[indexExpected++], linesReceived[indexReceived++]];
};

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
  const getter = original && getterForHunks(original);
  let isDifferent = false;
  // Make sure the strings end with a newline.
  if (!a.endsWith('\n')) {
    a += '\n';
  }
  if (!b.endsWith('\n')) {
    b += '\n';
  }

  const oldLinesCount = (a.match(/\n/g) || []).length;

  return {
    diff: structuredPatch('', '', a, b, '', '', options).hunks
      .map((hunk: Hunk) => {
        // Hunk properties are one-based but index args are zero-based.
        const getOriginal =
          getter && getter(hunk.oldStart - 1, hunk.newStart - 1);
        const lines = hunk.lines
          .map(line => formatLine(line[0], line.slice(1), getOriginal))
          .join('\n');

        isDifferent = true;
        return shouldShowPatchMarks(hunk, oldLinesCount)
          ? createPatchMark(hunk) + lines
          : lines;
      })
      .join('\n'),
    isDifferent,
  };
};

function diffStrings(
  a: string,
  b: string,
  options: ?DiffOptions,
  original?: Original,
): string {
  // `diff` uses the Myers LCS diff algorithm which runs in O(n+d^2) time
  // (where "d" is the edit distance) and can get very slow for large edit
  // distances. Mitigate the cost by switching to a lower-resolution diff
  // whenever linebreaks are involved.
  const result =
    options && options.expand === false
      ? formatHunks(a, b, options && options.contextLines, original)
      : formatChunks(a, b, original);

  if (result.isDifferent) {
    return getAnnotation(options) + result.diff;
  } else {
    return NO_DIFF_MESSAGE;
  }
}

module.exports = diffStrings;
