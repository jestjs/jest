/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pico from 'picocolors';
import {getType} from 'jest-get-type';
import {
  type PrettyFormatOptions,
  format as prettyFormat,
  plugins as prettyFormatPlugins,
} from 'pretty-format';
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, Diff} from './cleanupSemantic';
import {NO_DIFF_MESSAGE, SIMILAR_MESSAGE} from './constants';
import {diffLinesRaw, diffLinesUnified, diffLinesUnified2} from './diffLines';
import {normalizeDiffOptions} from './normalizeDiffOptions';
import {diffStringsRaw, diffStringsUnified} from './printDiffs';
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
} = prettyFormatPlugins;

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
const FALLBACK_FORMAT_OPTIONS = {
  callToJSON: false,
  maxDepth: 10,
  plugins: PLUGINS,
};

// Generate a string that will highlight the difference between two values
// with green and red. (similar to how github does code diffing)
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function diff(a: any, b: any, options?: DiffOptions): string | null {
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
      ` Expected ${pico.green(expectedType)} but ` +
      `received ${pico.red(getType(b))}.`
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
  return new Map([...map].sort());
}

function sortSet(set: Set<unknown>) {
  return new Set([...set].sort());
}

function compareObjects(
  a: Record<string, any>,
  b: Record<string, any>,
  options?: DiffOptions,
) {
  let difference;
  let hasThrown = false;

  try {
    const formatOptions = getFormatOptions(FORMAT_OPTIONS, options);
    difference = getObjectsDifference(a, b, formatOptions, options);
  } catch {
    hasThrown = true;
  }

  const noDiffMessage = getCommonMessage(NO_DIFF_MESSAGE, options);
  // If the comparison yields no results, compare again but this time
  // without calling `toJSON`. It's also possible that toJSON might throw.
  if (difference === undefined || difference === noDiffMessage) {
    const formatOptions = getFormatOptions(FALLBACK_FORMAT_OPTIONS, options);
    difference = getObjectsDifference(a, b, formatOptions, options);

    if (difference !== noDiffMessage && !hasThrown) {
      difference = `${getCommonMessage(
        SIMILAR_MESSAGE,
        options,
      )}\n\n${difference}`;
    }
  }

  return difference;
}

function getFormatOptions(
  formatOptions: PrettyFormatOptions,
  options?: DiffOptions,
): PrettyFormatOptions {
  const {compareKeys} = normalizeDiffOptions(options);

  return {
    ...formatOptions,
    compareKeys,
  };
}

function getObjectsDifference(
  a: Record<string, any>,
  b: Record<string, any>,
  formatOptions: PrettyFormatOptions,
  options?: DiffOptions,
): string {
  const formatOptionsZeroIndent = {...formatOptions, indent: 0};
  const aCompare = prettyFormat(a, formatOptionsZeroIndent);
  const bCompare = prettyFormat(b, formatOptionsZeroIndent);

  if (aCompare === bCompare) {
    return getCommonMessage(NO_DIFF_MESSAGE, options);
  } else {
    const aDisplay = prettyFormat(a, formatOptions);
    const bDisplay = prettyFormat(b, formatOptions);

    return diffLinesUnified2(
      aDisplay.split('\n'),
      bDisplay.split('\n'),
      aCompare.split('\n'),
      bCompare.split('\n'),
      options,
    );
  }
}
