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
const DIFF_CONTEXT = 5;

export type DiffOptions = {|
  aAnnotation?: string,
  bAnnotation?: string,
  expand?: boolean,
  snapshot?: boolean,
|};

export type Replacement = {|
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

// Given string, return array of its lines.
function splitIntoLines(string) {
  const lines = string.split('\n');

  if (lines.length !== 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines;
}

// Replace unindented lines with original lines.
function replaceValueOfChunks(chunks, replacement) {
  const aLines = splitIntoLines(replacement.a);
  const bLines = splitIntoLines(replacement.b);

  let aIndex = 0;
  let bIndex = 0;
  chunks.forEach(chunk => {
    const count = chunk.count; // number of lines in chunk

    // Assume that a is expected and b is received.
    if (chunk.removed) {
      chunk.value = aLines
        .slice(aIndex, (aIndex += count))
        .map(line => line + '\n')
        .join('');
    } else {
      chunk.value = bLines
        .slice(bIndex, (bIndex += count))
        .map(line => line + '\n')
        .join('');
      if (!chunk.added) {
        aIndex += count; // increment both if chunk is unchanged
      }
    }
  });

  return chunks;
}

const diffLinesWithReplacement = (
  a: string,
  b: string,
  replacement?: Replacement,
): Diff => {
  let chunks = diffLines(a, b);
  if (replacement) {
    chunks = replaceValueOfChunks(chunks, replacement);
  }
  let isDifferent = false;
  return {
    diff: chunks
      .map(part => {
        const {added, removed, value} = part;
        if (added || removed) {
          isDifferent = true;
        }

        const lines = splitIntoLines(value);
        const color = getColor(added, removed);
        const bgColor = getBgColor(added, removed);

        return lines
          .map(line => {
            const highlightedLine = highlightTrailingWhitespace(line, bgColor);
            const mark = color(added ? '+' : removed ? '-' : ' ');
            return mark + color(highlightedLine) + '\n';
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

// Replace unindented lines with original lines.
function replaceLinesInHunks(hunks, replacement) {
  const aLines = splitIntoLines(replacement.a);
  const bLines = splitIntoLines(replacement.b);

  hunks.forEach(hunk => {
    // hunk has one-based line numbers
    let aIndex = hunk.oldStart - 1;
    let bIndex = hunk.newStart - 1;

    // Assume that a is expected and b is received.
    hunk.lines = hunk.lines.map(line => {
      const mark = line[0];
      if (mark === ' ') {
        aIndex += 1; // increment both if line is unchanged
      }
      return mark + (mark === '-' ? aLines[aIndex++] : bLines[bIndex++]);
    });
  });

  return hunks;
}

const structuredPatchWithReplacement = (
  a: string,
  b: string,
  replacement?: Replacement,
): Diff => {
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
  let hunks = structuredPatch('', '', a, b, '', '', options).hunks;
  if (replacement) {
    hunks = replaceLinesInHunks(hunks, replacement);
  }

  return {
    diff: hunks
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

function diffStrings(
  a: string,
  b: string,
  options: ?DiffOptions,
  replacement?: Replacement,
): string {
  // `diff` uses the Myers LCS diff algorithm which runs in O(n+d^2) time
  // (where "d" is the edit distance) and can get very slow for large edit
  // distances. Mitigate the cost by switching to a lower-resolution diff
  // whenever linebreaks are involved.
  const result = options && options.expand === false
    ? structuredPatchWithReplacement(a, b, replacement)
    : diffLinesWithReplacement(a, b, replacement);

  if (result.isDifferent) {
    return getAnnotation(options) + result.diff;
  } else {
    return NO_DIFF_MESSAGE;
  }
}

module.exports = diffStrings;
