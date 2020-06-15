/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prettyFormat = require('pretty-format');
import chalk = require('chalk');
import getType = require('jest-get-type');
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, Diff} from './cleanupSemantic';
import {normalizeDiffOptions} from './normalizeDiffOptions';
import {diffLinesRaw, diffLinesUnified, diffLinesUnified2} from './diffLines';
import {diffStringsRaw, diffStringsUnified} from './printDiffs';
import {NO_DIFF_MESSAGE, SIMILAR_MESSAGE} from './constants';
import type {DiffOptions} from './types';

export type {DiffOptions, DiffOptionsColor} from './types';

export {diffLinesRaw, diffLinesUnified, diffLinesUnified2};
export {diffStringsRaw, diffStringsUnified};
export {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, Diff};

const getCommonMessage = (message: string, options?: DiffOptions) => {
  const {commonColor} = normalizeDiffOptions(options);
  return commonColor(message);
};

const {
  AsymmetricMatcher,
  DOMCollection,
  DOMElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
} = prettyFormat.plugins;

const PLUGINS = [
  ReactTestComponent,
  ReactElement,
  DOMElement,
  DOMCollection,
  Immutable,
  AsymmetricMatcher,
];
const FORMAT_OPTIONS = {
  plugins: PLUGINS,
};
const FORMAT_OPTIONS_0 = {...FORMAT_OPTIONS, indent: 0};
const FALLBACK_FORMAT_OPTIONS = {
  callToJSON: false,
  maxDepth: 10,
  plugins: PLUGINS,
};
const FALLBACK_FORMAT_OPTIONS_0 = {...FALLBACK_FORMAT_OPTIONS, indent: 0};

// Generate a string that will highlight the difference between two values
// with green and red. (similar to how github does code diffing)
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function diff(a: any, b: any, options?: DiffOptions): string | null {
  if (Object.is(a, b)) {
    return getCommonMessage(NO_DIFF_MESSAGE, options);
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
      return diffLinesUnified(a.split('\n'), b.split('\n'), options);
    case 'boolean':
    case 'number':
      return comparePrimitive(a, b, options);
    case 'map':
      return compareObjects(sortMap(a), sortMap(b), options);
    case 'set':
      return compareObjects(sortSet(a), sortSet(b), options);
    default:
      return compareObjects(a, b, options);
  }
}

function comparePrimitive(
  a: number | boolean,
  b: number | boolean,
  options?: DiffOptions,
) {
  const aFormat = prettyFormat(a, FORMAT_OPTIONS);
  const bFormat = prettyFormat(b, FORMAT_OPTIONS);
  return aFormat === bFormat
    ? getCommonMessage(NO_DIFF_MESSAGE, options)
    : diffLinesUnified(aFormat.split('\n'), bFormat.split('\n'), options);
}

function sortMap(map: Map<unknown, unknown>) {
  return new Map(Array.from(map.entries()).sort());
}

function sortSet(set: Set<unknown>) {
  return new Set(Array.from(set.values()).sort());
}

function compareObjects(
  a: Record<string, any>,
  b: Record<string, any>,
  options?: DiffOptions,
) {
  let difference;
  let hasThrown = false;
  const noDiffMessage = getCommonMessage(NO_DIFF_MESSAGE, options);

  try {
    const aCompare = prettyFormat(a, FORMAT_OPTIONS_0);
    const bCompare = prettyFormat(b, FORMAT_OPTIONS_0);

    if (aCompare === bCompare) {
      difference = noDiffMessage;
    } else {
      const aDisplay = prettyFormat(a, FORMAT_OPTIONS);
      const bDisplay = prettyFormat(b, FORMAT_OPTIONS);

      difference = diffLinesUnified2(
        aDisplay.split('\n'),
        bDisplay.split('\n'),
        aCompare.split('\n'),
        bCompare.split('\n'),
        options,
      );
    }
  } catch (e) {
    hasThrown = true;
  }

  // If the comparison yields no results, compare again but this time
  // without calling `toJSON`. It's also possible that toJSON might throw.
  if (difference === undefined || difference === noDiffMessage) {
    const aCompare = prettyFormat(a, FALLBACK_FORMAT_OPTIONS_0);
    const bCompare = prettyFormat(b, FALLBACK_FORMAT_OPTIONS_0);

    if (aCompare === bCompare) {
      difference = noDiffMessage;
    } else {
      const aDisplay = prettyFormat(a, FALLBACK_FORMAT_OPTIONS);
      const bDisplay = prettyFormat(b, FALLBACK_FORMAT_OPTIONS);

      difference = diffLinesUnified2(
        aDisplay.split('\n'),
        bDisplay.split('\n'),
        aCompare.split('\n'),
        bCompare.split('\n'),
        options,
      );
    }

    if (difference !== noDiffMessage && !hasThrown) {
      difference =
        getCommonMessage(SIMILAR_MESSAGE, options) + '\n\n' + difference;
    }
  }

  return difference;
}

export default diff;
