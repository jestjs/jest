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

import type {DiffOptions} from './diffStrings';

const chalk = require('chalk');
const diffStrings = require('./diffStrings');
const {getType} = require('jest-matcher-utils');
const jsxLikeExtension = require('pretty-format/plugins/ReactTestComponent');
const prettyFormat = require('pretty-format');

const NO_DIFF_MESSAGE = require('./constants').NO_DIFF_MESSAGE;

// Generate a string that will highlight the difference between two values
// with green and red. (similar to how github does code diffing)
function diff(a: any, b: any, options: ?DiffOptions): ?string {
  if (a === b) {
    return NO_DIFF_MESSAGE;
  }

  if (getType(a) !== getType(b)) {
    return (
      'Comparing two different types of values:\n' +
      `  Expected: ${chalk.green(getType(a))}\n` +
      `  Received: ${chalk.red(getType(b))}`
    );
  }

  switch (getType(a)) {
    case 'string':
      const multiline = a.match(/[\r\n]/) !== -1 && b.indexOf('\n') !== -1;
      if (multiline) {
        return diffStrings(String(a), String(b), options);
      }
      return null;
    case 'number':
    case 'boolean':
      return null;
    default:
      return diffStrings(
        prettyFormat(a, {plugins: [jsxLikeExtension]}, options),
        prettyFormat(b, {plugins: [jsxLikeExtension]}, options),
      );
  }
}

module.exports = diff;
