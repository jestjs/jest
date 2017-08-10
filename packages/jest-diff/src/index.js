/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {DiffOptions} from './diff_strings';

import prettyFormat from 'pretty-format';
import chalk from 'chalk';
import getType from 'jest-get-type';
import diffStrings from './diff_strings';
import {NO_DIFF_MESSAGE, SIMILAR_MESSAGE} from './constants';

const {
  AsymmetricMatcher,
  HTMLElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
} = prettyFormat.plugins;

const PLUGINS = [
  ReactTestComponent,
  ReactElement,
  HTMLElement,
  Immutable,
  AsymmetricMatcher,
];
const FORMAT_OPTIONS = {
  plugins: PLUGINS,
};
const FALLBACK_FORMAT_OPTIONS = {
  callToJSON: false,
  maxDepth: 10,
  plugins: PLUGINS,
};

// Generate a string that will highlight the difference between two values
// with green and red. (similar to how github does code diffing)
function diff(a: any, b: any, options: ?DiffOptions): ?string {
  if (a === b) {
    return NO_DIFF_MESSAGE;
  }

  const aType = getType(a);
  let expectedType = aType;
  let omitDifference = false;
  if (aType === 'object' && typeof a.asymmetricMatch === 'function') {
    if (a.$$typeof !== Symbol.for('jest.asymmetricMatcher')) {
      // Do not know expected type of user-defined asymmetric matcher.
      return null;
    }
    if (typeof a.getExpectedType !== 'function') {
      // For example, expect.anything() matches either null or undefined
      return null;
    }
    expectedType = a.getExpectedType();
    // Primitive types boolean and number omit difference below.
    // For example, omit difference for expect.stringMatching(regexp)
    omitDifference = expectedType === 'string';
  }

  if (expectedType !== getType(b)) {
    return (
      '  Comparing two different types of values.' +
      ` Expected ${chalk.green(expectedType)} but ` +
      `received ${chalk.red(getType(b))}.`
    );
  }

  if (omitDifference) {
    return null;
  }

  switch (aType) {
    case 'string':
      const multiline = a.match(/[\r\n]/) !== -1 && b.indexOf('\n') !== -1;
      if (multiline) {
        return diffStrings(String(a), String(b), options);
      }
      return null;
    case 'number':
    case 'boolean':
      return null;
    case 'map':
      return compareObjects(sortMap(a), sortMap(b), options);
    case 'set':
      return compareObjects(sortSet(a), sortSet(b), options);
    default:
      return compareObjects(a, b, options);
  }
}

function sortMap(map) {
  return new Map(Array.from(map.entries()).sort());
}

function sortSet(set) {
  return new Set(Array.from(set.values()).sort());
}

function compareObjects(a: Object, b: Object, options: ?DiffOptions) {
  let diffMessage;
  let hasThrown = false;

  try {
    diffMessage = diffStrings(
      prettyFormat(a, FORMAT_OPTIONS),
      prettyFormat(b, FORMAT_OPTIONS),
      options,
    );
  } catch (e) {
    hasThrown = true;
  }

  // If the comparison yields no results, compare again but this time
  // without calling `toJSON`. It's also possible that toJSON might throw.
  if (!diffMessage || diffMessage === NO_DIFF_MESSAGE) {
    diffMessage = diffStrings(
      prettyFormat(a, FALLBACK_FORMAT_OPTIONS),
      prettyFormat(b, FALLBACK_FORMAT_OPTIONS),
      options,
    );
    if (diffMessage !== NO_DIFF_MESSAGE && !hasThrown) {
      diffMessage = SIMILAR_MESSAGE + '\n\n' + diffMessage;
    }
  }

  return diffMessage;
}

module.exports = diff;
