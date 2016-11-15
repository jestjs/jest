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

const chalk = require('chalk');
const diff = require('diff');

const {NO_DIFF_MESSAGE} = require('./constants.js');
const DIFF_CONTEXT = 5;

export type DiffOptions = {|
  aAnnotation?: string,
  bAnnotation?: string,
  expand?: boolean,
|};

type Diff = {diff: string, isDifferent: boolean};

const getAnnotation = (options: ?DiffOptions): string =>
  chalk.green('- ' + ((options && options.aAnnotation) || 'Expected')) + '\n' +
  chalk.red('+ ' + ((options && options.bAnnotation) || 'Received')) + '\n\n';

const diffLines = (a: string, b: string): Diff => {
  let isDifferent = false;
  return {
    diff: diff.diffLines(a, b).map(part => {
      if (part.added || part.removed) {
        isDifferent = true;
      }

      const lines = part.value.split('\n');
      const color = part.added
        ? chalk.red
        : (part.removed ? chalk.green : chalk.dim);

      if (lines[lines.length - 1] === '') {
        lines.pop();
      }

      return lines.map(line => {
        const mark = color(part.added ? '+' : part.removed ? '-' : ' ');
        return mark + ' ' +  color(line) + '\n';
      }).join('');
    }).join('').trim(),
    isDifferent,
  };
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

  return {
    diff: diff.structuredPatch('', '', a, b, '', '', options)
      .hunks.map(hunk => {
        const diffMarkOld = `-${hunk.oldStart},${hunk.oldLines}`;
        const diffMarkNew = `+${hunk.newStart},${hunk.newLines}`;
        const diffMark = chalk.yellow(`@@ ${diffMarkOld} ${diffMarkNew} @@\n`);

        const lines = hunk.lines.map(line => {
          const added = line[0] === '+';
          const removed = line[0] === '-';

          const color = added
            ? chalk.red
            : (removed ? chalk.green : chalk.dim);

          return color(line) + '\n';
        }).join('');

        isDifferent = true;
        return diffMark + lines;
      }).join('').trim(),
    isDifferent,
  };
};

function diffStrings(a: string, b: string, options: ?DiffOptions): string {
  // `diff` uses the Myers LCS diff algorithm which runs in O(n+d^2) time
  // (where "d" is the edit distance) and can get very slow for large edit
  // distances. Mitigate the cost by switching to a lower-resolution diff
  // whenever linebreaks are involved.
  const result = (options && options.expand === false)
    ? structuredPatch(a, b)
    : diffLines(a, b);

  if (result.isDifferent) {
    return getAnnotation(options) + result.diff;
  } else {
    return NO_DIFF_MESSAGE;
  }
}

module.exports = diffStrings;
