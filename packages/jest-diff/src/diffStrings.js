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
const jsDiff = require('diff');

const ANNOTATION = `${chalk.red('- expected')} ${chalk.green('+ actual')}\n\n`;
const NO_DIFF_MESSAGE = require('./constants.js').NO_DIFF_MESSAGE;

// diff characters if oneliner and diff lines if multiline
function diffStrings(a: string, b: string): ?string {
  const multiline = a.match(/[\r\n]/) !== -1 && b.indexOf('\n') !== -1;
  let isDifferent = false;
  let result;

  // `diff` uses the Myers LCS diff algorithm which runs in O(n+d^2) time
  // (where "d" is the edit distance) and can get very slow for large edit
  // distances. Mitigate the cost by switching to a lower-resolution diff
  // whenever linebreaks are involved.
  if (multiline) {
    result = jsDiff.diffLines(a, b).map(part => {
      if (part.added || part.removed) {
        isDifferent = true;
      }

      const lines = part.value.split('\n');
      const color = part.added
        ? chalk.green
        : (part.removed ? chalk.red : chalk.white);

      if (lines[lines.length - 1] === '') {
        lines.pop();
      }

      return lines.map(line => {
        const mark = part.added
          ? chalk.green('+')
          : part.removed ? chalk.red('-') : ' ';
        return mark + ' ' +  color(line) + '\n';
      }).join('');
    }).join('');
  } else {
    result = jsDiff.diffChars(a, b).map(part => {
      if (part.added || part.removed) {
        isDifferent = true;
      }

      const color = part.added
        ? chalk.green
        : (part.removed ? chalk.red : chalk.gray);
      return color(part.value);
    }).join('');
  }

  if (isDifferent) {
    return ANNOTATION + result;
  } else {
    return NO_DIFF_MESSAGE;
  }
}

module.exports = diffStrings;
