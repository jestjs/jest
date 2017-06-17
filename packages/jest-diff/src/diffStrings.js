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
import {
  diffLines as diffLinesDiffer,
  structuredPatch as structuredPatchDiffer,
} from 'diff';

import {NO_DIFF_MESSAGE} from './constants.js';
const DIFF_CONTEXT = 5;

export type DiffOptions = {|
  aAnnotation?: string,
  bAnnotation?: string,
  expand?: boolean,
|};

type Diff = {diff: string, isDifferent: boolean};

type Hunk = {|
  lines: Array<string>,
  newLines: number,
  newStart: number,
  oldLines: number,
  oldStart: number,
|};

const getColor = (added: boolean, removed: boolean): chalk =>
  added ? chalk.red : removed ? chalk.green : chalk.dim;

const getBgColor = (added: boolean, removed: boolean): chalk =>
  added ? chalk.bgRed : removed ? chalk.bgGreen : chalk.dim;

const highlightTrailingWhitespace = (line: string, bgColor: Function): string =>
  line.replace(/\s+$/, bgColor('$&'));

const getAnnotation = (options: ?DiffOptions): string =>
  chalk.green('- ' + ((options && options.aAnnotation) || 'Expected')) +
  '\n' +
  chalk.red('+ ' + ((options && options.bAnnotation) || 'Received')) +
  '\n\n';

const diffLines = (a: string, b: string): Diff => {
  let isDifferent = false;
  return {
    diff: diffLinesDiffer(a, b)
      .map(part => {
        const {added, removed} = part;
        if (part.added || part.removed) {
          isDifferent = true;
        }

        const lines = part.value.split('\n');
        const color = getColor(added, removed);
        const bgColor = getBgColor(added, removed);

        if (lines[lines.length - 1] === '') {
          lines.pop();
        }

        return lines
          .map(line => {
            const highlightedLine = highlightTrailingWhitespace(line, bgColor);
            const mark = color(part.added ? '+' : part.removed ? '-' : ' ');
            return mark + ' ' + color(highlightedLine) + '\n';
          })
          .join('');
      })
      .join('')
      .trim(),
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

const structuredPatch = (a: string, b: string): Diff => {
  const options = {context: DIFF_CONTEXT};
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
    diff: structuredPatchDiffer('', '', a, b, '', '', options).hunks
      .map((hunk: Hunk) => {
        const lines = hunk.lines
          .map(line => {
            const added = line[0] === '+';
            const removed = line[0] === '-';

            const color = getColor(added, removed);
            const bgColor = getBgColor(added, removed);

            const highlightedLine = highlightTrailingWhitespace(line, bgColor);
            return color(highlightedLine) + '\n';
          })
          .join('');

        isDifferent = true;
        return shouldShowPatchMarks(hunk, oldLinesCount)
          ? createPatchMark(hunk) + lines
          : lines;
      })
      .join('')
      .trim(),
    isDifferent,
  };
};

function diffStrings(a: string, b: string, options: ?DiffOptions): string {
  // `diff` uses the Myers LCS diff algorithm which runs in O(n+d^2) time
  // (where "d" is the edit distance) and can get very slow for large edit
  // distances. Mitigate the cost by switching to a lower-resolution diff
  // whenever linebreaks are involved.
  const result = options && options.expand === false
    ? structuredPatch(a, b)
    : diffLines(a, b);

  if (result.isDifferent) {
    return getAnnotation(options) + result.diff;
  } else {
    return NO_DIFF_MESSAGE;
  }
}

module.exports = diffStrings;
