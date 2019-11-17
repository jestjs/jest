/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
// Temporary hack because getObjectSubset has known limitations,
// is not in the public interface of the expect package,
// and the long-term goal is to use a non-serialization diff.
import {getObjectSubset} from 'expect/build/utils';
import {
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  Diff,
  diffLinesUnified,
  diffStringsRaw,
  diffStringsUnified,
} from 'jest-diff';
import getType = require('jest-get-type');
import {
  BOLD_WEIGHT,
  EXPECTED_COLOR,
  INVERTED_COLOR,
  MatcherHintOptions,
  RECEIVED_COLOR,
  getLabelPrinter,
  matcherHint,
} from 'jest-matcher-utils';
import prettyFormat = require('pretty-format');
import {MatchSnapshotConfig} from './types';
import {deserializeString, minify, serialize} from './utils';

export const noColor = (string: string) => string;

export const HINT_ARG = 'hint';
export const SNAPSHOT_ARG = 'snapshot';
export const PROPERTIES_ARG = 'properties';

export const matcherHintFromConfig = (
  {
    context: {isNot, promise},
    hint,
    inlineSnapshot,
    matcherName,
    properties,
  }: MatchSnapshotConfig,
  isUpdatable: boolean,
): string => {
  const options: MatcherHintOptions = {isNot, promise};

  let expectedArgument = '';

  if (typeof properties === 'object') {
    expectedArgument = PROPERTIES_ARG;
    if (isUpdatable) {
      options.expectedColor = noColor;
    }

    if (typeof hint === 'string' && hint.length !== 0) {
      options.secondArgument = HINT_ARG;
      options.secondArgumentColor = BOLD_WEIGHT;
    } else if (typeof inlineSnapshot === 'string') {
      options.secondArgument = SNAPSHOT_ARG;
      if (!isUpdatable) {
        options.secondArgumentColor = noColor;
      }
    }
  } else {
    if (typeof hint === 'string' && hint.length !== 0) {
      expectedArgument = HINT_ARG;
      options.expectedColor = BOLD_WEIGHT;
    } else if (typeof inlineSnapshot === 'string') {
      expectedArgument = SNAPSHOT_ARG;
      if (!isUpdatable) {
        options.expectedColor = noColor;
      }
    }
  }

  return matcherHint(matcherName, undefined, expectedArgument, options);
};

// Given array of diffs, return string:
// * include common substrings
// * exclude change substrings which have opposite op
// * include change substrings which have argument op
//   with change color only if there is a common substring
const joinDiffs = (
  diffs: Array<Diff>,
  op: number,
  hasCommon: boolean,
): string =>
  diffs.reduce(
    (reduced: string, diff: Diff): string =>
      reduced +
      (diff[0] === DIFF_EQUAL
        ? diff[1]
        : diff[0] !== op
        ? ''
        : hasCommon
        ? INVERTED_COLOR(diff[1])
        : diff[1]),
    '',
  );

const isLineDiffable = (received: any): boolean => {
  const receivedType = getType(received);

  if (getType.isPrimitive(received)) {
    return typeof received === 'string';
  }

  if (
    receivedType === 'date' ||
    receivedType === 'function' ||
    receivedType === 'regexp'
  ) {
    return false;
  }

  if (received instanceof Error) {
    return false;
  }

  if (
    receivedType === 'object' &&
    typeof (received as any).asymmetricMatch === 'function'
  ) {
    return false;
  }

  return true;
};

export const printExpected = (val: unknown) => EXPECTED_COLOR(minify(val));
export const printReceived = (val: unknown) => RECEIVED_COLOR(minify(val));

export const printPropertiesAndReceived = (
  properties: object,
  received: object,
  expand: boolean, // CLI options: true if `--expand` or false if `--no-expand`
): string => {
  const aAnnotation = 'Expected properties';
  const bAnnotation = 'Received value';

  if (isLineDiffable(properties) && isLineDiffable(received)) {
    return diffLinesUnified(
      serialize(properties).split('\n'),
      serialize(getObjectSubset(received, properties)).split('\n'),
      {
        aAnnotation,
        aColor: EXPECTED_COLOR,
        bAnnotation,
        bColor: RECEIVED_COLOR,
        changeLineTrailingSpaceColor: chalk.bgYellow,
        commonLineTrailingSpaceColor: chalk.bgYellow,
        emptyFirstOrLastLinePlaceholder: '↵', // U+21B5
        expand,
        includeChangeCounts: true,
      },
    );
  }

  const printLabel = getLabelPrinter(aAnnotation, bAnnotation);
  return (
    printLabel(aAnnotation) +
    printExpected(properties) +
    '\n' +
    printLabel(bAnnotation) +
    printReceived(received)
  );
};

const MAX_DIFF_STRING_LENGTH = 20000;

export const printSnapshotAndReceived = (
  a: string, // snapshot without extra line breaks
  b: string, // received serialized but without extra line breaks
  received: unknown,
  expand: boolean, // CLI options: true if `--expand` or false if `--no-expand`
): string => {
  const aAnnotation = 'Snapshot';
  const bAnnotation = 'Received';
  const aColor = EXPECTED_COLOR;
  const bColor = RECEIVED_COLOR;
  const options = {
    aAnnotation,
    aColor,
    bAnnotation,
    bColor,
    changeLineTrailingSpaceColor: chalk.bgYellow,
    commonLineTrailingSpaceColor: chalk.bgYellow,
    emptyFirstOrLastLinePlaceholder: '↵', // U+21B5
    expand,
    includeChangeCounts: true,
  };

  if (typeof received === 'string') {
    if (
      a.length >= 2 &&
      a.startsWith('"') &&
      a.endsWith('"') &&
      b === prettyFormat(received)
    ) {
      // If snapshot looks like default serialization of a string
      // and received is string which has default serialization.

      if (!a.includes('\n') && !b.includes('\n')) {
        // If neither string is multiline,
        // display as labels and quoted strings.
        let aQuoted = a;
        let bQuoted = b;

        if (
          a.length - 2 <= MAX_DIFF_STRING_LENGTH &&
          b.length - 2 <= MAX_DIFF_STRING_LENGTH
        ) {
          const diffs = diffStringsRaw(a.slice(1, -1), b.slice(1, -1), true);
          const hasCommon = diffs.some(diff => diff[0] === DIFF_EQUAL);
          aQuoted = '"' + joinDiffs(diffs, DIFF_DELETE, hasCommon) + '"';
          bQuoted = '"' + joinDiffs(diffs, DIFF_INSERT, hasCommon) + '"';
        }

        const printLabel = getLabelPrinter(aAnnotation, bAnnotation);
        return (
          printLabel(aAnnotation) +
          aColor(aQuoted) +
          '\n' +
          printLabel(bAnnotation) +
          bColor(bQuoted)
        );
      }

      // Else either string is multiline, so display as unquoted strings.
      a = deserializeString(a); //  hypothetical expected string
      b = received; // not serialized
    }
    // Else expected had custom serialization or was not a string
    // or received has custom serialization.

    return a.length <= MAX_DIFF_STRING_LENGTH &&
      b.length <= MAX_DIFF_STRING_LENGTH
      ? diffStringsUnified(a, b, options)
      : diffLinesUnified(a.split('\n'), b.split('\n'), options);
  }

  if (isLineDiffable(received)) {
    // TODO future PR will replace with diffLinesUnified2 to ignore indentation
    return diffLinesUnified(a.split('\n'), b.split('\n'), options);
  }

  const printLabel = getLabelPrinter(aAnnotation, bAnnotation);
  return (
    printLabel(aAnnotation) +
    aColor(a) +
    '\n' +
    printLabel(bAnnotation) +
    bColor(b)
  );
};
