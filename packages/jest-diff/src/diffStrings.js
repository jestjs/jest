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

const {NO_DIFF_MESSAGE} = require('./constants.js');

export type DiffOptions = {
  aAnnotation: string,
  bAnnotation: string,
};

const getAnnotation = options =>
  chalk.green('- ' + ((options && options.aAnnotation) || 'Expected')) + '\n' +
  chalk.red('+ ' + ((options && options.bAnnotation) || 'Received')) + '\n\n';

// diff characters if oneliner and diff lines if multiline
function diffStrings(a: string, b: string, options: ?DiffOptions): ?string {
  let isDifferent = false;

  // `diff` uses the Myers LCS diff algorithm which runs in O(n+d^2) time
  // (where "d" is the edit distance) and can get very slow for large edit
  // distances. Mitigate the cost by switching to a lower-resolution diff
  // whenever linebreaks are involved.
  const result = jsDiff.diffLines(a, b).map(part => {
    if (part.added || part.removed) {
      isDifferent = true;
    }

    const lines = part.value.split('\n');
    const color = part.added
      ? chalk.red
      : (part.removed ? chalk.green : chalk.white);

    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    return lines.map(line => {
      const mark = color(part.added ? '+' : part.removed ? '-' : ' ');
      return mark + ' ' +  color(line) + '\n';
    }).join('');
  }).join('').trim();

  if (isDifferent) {
    return getAnnotation(options) + result;
  } else {
    return NO_DIFF_MESSAGE;
  }
}

module.exports = diffStrings;
