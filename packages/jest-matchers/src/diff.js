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

const jsDiff = require('diff');
const chalk = require('chalk');

const ANNOTATION = `${chalk.red('- expected')} ${chalk.green('+ actual')}\n\n`;


type ValueType = 'undefined' | 'null' | 'object' | 'string' | 'number'
  | 'array' | 'function';

// Generate a string that will highlight the difference between two values
// with green and red. (similar to how github does code diffing)
function diff(a: any, b: any): ?string {
  if (a === b) {
    return null;
  }


  if (_type(a) !== _type(b)) {
    return 'comparing different types of values: ' +
      `'${_type(a)}' and '${_type(b)}'`;
  }

  switch (_type(a)) {
    case 'string':
      return diffStrings(String(a), String(b));
    case 'object':
    case 'array':
      return diffStructures(
        (a: Object | Array<any>),
        (b: Object | Array<any>),
      );
  }

  return diffStrings(
    JSON.stringify(a, null, 2),
    JSON.stringify(b, null, 2),
  );
}

// diff characters if oneliner and diff lines if multiline
function diffStrings(a: string, b: string): string {
  const multiline = a.indexOf('\n') !== -1 && b.indexOf('\n') !== -1;

  if (multiline) {
    return '\n' + jsDiff.diffLines(a, b).map(part => {
      const lines = part.value.split('\n');
      const color = part.added ? 'green' : part.removed ? 'red' : 'white';

      if (lines[lines.length - 1] === '') {
        lines.pop();
      }

      return ANNOTATION + lines.map(line => {
        const mark = part.added
          ? chalk.green('+')
          : part.removed ? chalk.red('-') : ' ';
        return mark + ' ' +  chalk[color](line) + '\n';
      }).join('');
    }).join('');
  } else {
    return ANNOTATION + jsDiff.diffChars(a, b).map(part => {
      const color = part.added ? 'green' : part.removed ? 'red' : 'gray';
      return chalk[color](part.value);
    }).join('');
  }
}

function diffStructures(
  a: Object | Array<any>,
  b: Object | Array<any>,
): ?string {
  return diffStrings(JSON.stringify(a, null, 2), JSON.stringify(b, null, 2));
}

function _type(value: any): ValueType {
  if (typeof value === 'undefined') {
    return 'undefined';
  } else if (value === null) {
    return 'null';
  } else if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'function') {
    return 'function';
  } else if (typeof value === 'number') {
    return 'number';
  } else if (typeof value === 'string') {
    return 'string';
  } else if (typeof value === 'object') {
    return 'object';
  }

  throw new Error(`unknown type: ${value}`);
}

module.exports = diff;
