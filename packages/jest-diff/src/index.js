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
const {getType} = require('jest-matcher-utils');
const jsxLikeExtension = require('pretty-format/plugins/ReactTestComponent');
const prettyFormat = require('pretty-format');

const NO_DIFF_MESSAGE = require('./constants').NO_DIFF_MESSAGE;

// Generate a string that will highlight the difference between two values
// with green and red. (similar to how github does code diffing)
function diff(a: any, b: any): ?string {
  if (a === b) {
    return NO_DIFF_MESSAGE;
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
    case 'number':
    case 'boolean':
      return chalk.gray('Actual: ') + chalk.red(b) +
        '\n' +
        chalk.gray('Expected: ') + chalk.green(a);
    default:
      return diffStrings(
        prettyFormat(a, {plugins: [jsxLikeExtension]}),
        prettyFormat(b, {plugins: [jsxLikeExtension]}),
      );
  }
}

module.exports = diff;
