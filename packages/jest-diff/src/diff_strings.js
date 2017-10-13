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
import DiffMatchPatch from 'diff-match-patch';

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

type DiffDigit = -1 | 1 | 0; // deleted | inserted | equal

type DiffItem = [DiffDigit, string]; // diff-match-patch
type DiffItems = Array<DiffItem>;
type DelInsDiffs = [Array<DiffItems>, Array<DiffItems>];

// Given diff digit, return array which consists of:
// if compared line is deleted or inserted: corresponding original line
// if compared line is equal: original received and expected lines
type GetOriginal = (digit: DiffDigit) => Array<string>;

// Given chunk, return diff character.
const getDiffChar = (chunk): string =>
  chunk.removed ? '-' : chunk.added ? '+' : ' ';

// Given diff character in line of hunk or computed from properties of chunk.
const getDiffDigit = (char: string): DiffDigit =>
  char === '-' ? -1 : char === '+' ? 1 : 0;

// Color for text of line.
const getColor = (digit: DiffDigit, onlyIndentationChanged?: boolean) => {
  if (digit === -1) {
    return chalk.green; // deleted
  }
  if (digit === 1) {
    return chalk.red; // inserted
  }
  return onlyIndentationChanged ? chalk.cyan : chalk.dim;
};

const bgChanged = chalk.inverse;

// Background color for leading or trailing spaces.
const getBgColor = (digit: DiffDigit, onlyIndentationChanged?: boolean) =>
  digit === 0 && !onlyIndentationChanged ? chalk.bgYellow : bgChanged;

// ONLY trailing if expected value is snapshot or multiline string.
const highlightTrailingSpaces = (line: string, bgColor: Function): string =>
  line.replace(/\s+$/, bgColor('$&'));

// BOTH leading AND trailing if expected value is data structure.
const highlightLeadingTrailingSpaces = (
  line: string,
  bgColor: Function,
): string =>
  // If line consists of ALL spaces: highlight all of them.
  highlightTrailingSpaces(line, bgColor).replace(
    // If line has an ODD length of leading spaces: highlight only the LAST.
    /^(\s\s)*(\s)(?=[^\s])/,
    '$1' + bgColor('$2'),
  );

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

// Return line length not including escape sequences around changed strings.
const getLength = (argCompared: DiffItems | string): number => {
  if (Array.isArray(argCompared)) {
    return argCompared.reduce((length, diff) => length + diff[1].length, 0);
  }
  return argCompared.length;
};

const diffStringMapper = diff => diff[1];
const diffChangeMapper = diff => (diff[0] !== 0 ? bgChanged(diff[1]) : diff[1]);

// Highlight changed strings only if line also has unchanged strings.
const getLine = (argCompared: DiffItems | string): string => {
  if (Array.isArray(argCompared)) {
    const diffMapper = argCompared.some(diff => diff[0] === 0)
      ? diffChangeMapper
      : diffStringMapper;
    return argCompared.map(diffMapper).join('');
  }
  return argCompared;
};

// Given diff character and compared line, return original line with colors.
const formatLine = (
  char: string,
  argCompared: DiffItems | string,
  getOriginal?: GetOriginal,
) => {
  const digit = getDiffDigit(char);
  const lineCompared = getLine(argCompared);

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
        lineOriginal.slice(0, lineOriginal.length - getLength(argCompared)) +
        highlightLeadingTrailingSpaces(
          lineCompared,
          getBgColor(digit, onlyIndentationChanged),
        ),
    );
  }

  // Format compared line when expected is snapshot or multiline string.
  return getColor(digit)(
    char + ' ' + highlightTrailingSpaces(lineCompared, getBgColor(digit)),
  );
};

const NEWLINE_REGEXP = /\n/;

// Given diff items from diff-match-patch,
// return them split or merged corresponding to deleted and inserted lines.
const alignDelInsDiffs = (diffs: DiffItems): DelInsDiffs => {
  const diffsDel = [[]];
  const diffsIns = [[]];

  diffs.forEach(diff => {
    const digit = diff[0];
    const value = diff[1];

    if (NEWLINE_REGEXP.test(value)) {
      value.split('\n').forEach((line, i, lines) => {
        // Omit any empty strings that split returns to separate newlines.
        const subdiff = line.length !== 0 ? [digit, line] : null;

        // If substring is unchanged, push onto deleted and inserted.
        if (digit !== 1) {
          if (subdiff !== null) {
            diffsDel[diffsDel.length - 1].push(subdiff);
          }
          if (i !== lines.length - 1) {
            diffsDel.push([]); // next line
          }
        }
        if (digit !== -1) {
          if (subdiff !== null) {
            diffsIns[diffsIns.length - 1].push(subdiff);
          }
          if (i !== lines.length - 1) {
            diffsIns.push([]); // next line
          }
        }
      });
    } else {
      // If string is unchanged, push onto deleted and inserted.
      if (digit !== 1) {
        diffsDel[diffsDel.length - 1].push(diff);
      }
      if (digit !== -1) {
        diffsIns[diffsIns.length - 1].push(diff);
      }
    }
  });

  // Omit newline after last line.
  diffsDel.pop();
  diffsIns.pop();

  return [diffsDel, diffsIns];
};

// Given adjacent deleted and inserted lines as strings with trailing newline,
// return data structure for changed and unchanged strings within the lines.
const computeDelInsDiffs = (
  stringDel: string,
  stringIns: string,
): DelInsDiffs => {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(stringDel, stringIns);
  dmp.diff_cleanupSemantic(diffs); // more often for better than for worse

  return alignDelInsDiffs(diffs);
};

// Given original lines, return callback function
// which given diff digit, returns array.
const getterForChunks = (original: Original) => {
  const linesExpected = splitIntoLines(original.a);
  const linesReceived = splitIntoLines(original.b);

  let iExpected = 0;
  let iReceived = 0;

  return (digit: DiffDigit) => {
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
  const lines = [];
  let i = 0;
  while (i !== chunks.length) {
    const chunk = chunks[i];
    if (
      getOriginal &&
      chunk.removed &&
      i + 1 !== chunks.length &&
      chunks[i + 1].added
    ) {
      // For now, only if expected value is data structure.
      // Highlight changed strings within adjacent deleted and inserted chunks.
      const [diffsDel, diffsIns] = computeDelInsDiffs(
        chunk.value,
        chunks[i + 1].value,
      );
      diffsDel.forEach(diffs => {
        lines.push(formatLine('-', diffs, getOriginal));
      });
      diffsIns.forEach(diffs => {
        lines.push(formatLine('+', diffs, getOriginal));
      });
      i += 2;
    } else {
      const char = getDiffChar(chunk);
      splitIntoLines(chunk.value).forEach(line => {
        lines.push(formatLine(char, line, getOriginal));
      });
      i += 1;
    }
  }
  return lines.join('\n');
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

  return (iExpected: number, iReceived: number) => (digit: DiffDigit) => {
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

// Return index at end of sequence of lines which correspond to a chunk.
const getIndexAfterDiffChar = (
  lines: Array<string>,
  char: string,
  i: number,
): number => {
  while (i !== lines.length && lines[i][0] === char) {
    i += 1;
  }
  return i;
};

// Return string which corresponds to a chunk.
const getStringFromLines = (
  lines: Array<string>,
  i: number,
  iEnd: number,
): string => {
  let string = '';
  while (i !== iEnd) {
    string += lines[i].slice(1) + '\n';
    i += 1;
  }
  return string;
};

// Given lines of hunk and getter for corresponding original lines,
// append the formatted lines to the result argument.
const formatHunk = (
  lines: Array<string>,
  hunkLines: Array<string>,
  getOriginal: GetOriginal,
) => {
  const length = hunkLines.length;
  let i = 0;
  while (i !== length) {
    const iAfterDel = getIndexAfterDiffChar(hunkLines, '-', i);

    if (iAfterDel !== i) {
      const iAfterIns = getIndexAfterDiffChar(hunkLines, '+', iAfterDel);

      if (iAfterIns !== iAfterDel) {
        // Highlight changed strings within adjacent deleted and inserted lines.
        const [diffsDel, diffsIns] = computeDelInsDiffs(
          getStringFromLines(hunkLines, i, iAfterDel),
          getStringFromLines(hunkLines, iAfterDel, iAfterIns),
        );
        diffsDel.forEach(diffs => {
          lines.push(formatLine('-', diffs, getOriginal));
        });
        diffsIns.forEach(diffs => {
          lines.push(formatLine('+', diffs, getOriginal));
        });
        i = iAfterIns;
      } else {
        // Format adjacent deleted lines that are not followed by inserted lines.
        while (i !== iAfterDel) {
          const line = hunkLines[i];
          lines.push(formatLine(line[0], line.slice(1), getOriginal));
          i += 1;
        }
      }
    } else {
      // Format the next line, which is inserted or unchanged.
      const line = hunkLines[i];
      lines.push(formatLine(line[0], line.slice(1), getOriginal));
      i += 1;
    }
  }
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
      if (getOriginal) {
        formatHunk(lines, hunk.lines, getOriginal);
      } else {
        hunk.lines.forEach(line => {
          lines.push(formatLine(line[0], line.slice(1)));
        });
      }

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
