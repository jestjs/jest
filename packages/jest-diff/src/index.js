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
const diffStrings = require('./diffStrings');
const getType = require('./getType');
const prettyFormat = require('pretty-format');

// Generate a string that will highlight the difference between two values
// with green and red. (similar to how github does code diffing)
// Return null if no visual diff can be calculated.
function diff(a: any, b: any): ?string {
  if (a === b) {
    return null;
  }

  if (getType(a) !== getType(b)) {
    return chalk.reset.gray(
      'Comparing different types of values.\n' +
      `Actual: '${chalk.cyan(getType(b))}'` +
      ', ' +
      `Expected: '${chalk.cyan(getType(a))}'`,
    );
  }

  switch (getType(a)) {
    case 'string':
      return diffStrings(String(a), String(b));
    default:
      return diffStrings(
        prettyFormat(a),
        prettyFormat(b),
      );
  }
}

module.exports = diff;
