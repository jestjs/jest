/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const jsDiff = require('diff');
const chalk = require('chalk');

// Generate a string that will highlight the difference between two values
// with green and red. (similar to how github does code diffing)
function diff(a, b) {
  if (a === b) {
    return null;
  }

  const message = `${chalk.red('- expected')} ${chalk.green('+ actual')}\n\n`;

  if (typeof a !== typeof b) {
    return `comparing different types of values`;
  }

  switch (typeof a) {
    case 'string':
      return message + diffStrings(a, b);
  }

  return message + diffStrings(
    JSON.stringify(a, null, 2),
    JSON.stringify(b, null, 2),
  );
}

function diffStrings(a, b) {
  const multiline = a.indexOf('\n') !== -1 && b.indexOf('\n') !== -1;

  if (multiline) {
    return '\n' + jsDiff.diffLines(a, b).map(part => {
      const lines = part.value.split('\n');
      const color = part.added ? 'green' : part.removed ? 'red' : 'white';

      if (lines[lines.length - 1] === '') {
        lines.pop();
      }

      return lines.map(line => {
        const mark = part.added
          ? chalk.green('+')
          : part.removed ? chalk.red('-') : ' ';
        return mark + ' ' +  chalk[color](line) + '\n';
      }).join('');
    }).join('');
  } else {
    return jsDiff.diffChars(a, b).map(part => {
      const color = part.added ? 'green' : part.removed ? 'red' : 'gray';
      return chalk[color](part.value);
    }).join('');
  }
}

module.exports = diff;
