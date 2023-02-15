/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import {getObjectSubset} from '@jest/expect-utils';
import {
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  Diff,
  DiffOptionsColor,
  diffLinesUnified,
  diffLinesUnified2,
  diffStringsRaw,
  diffStringsUnified,
} from 'jest-diff';
import {getType, isPrimitive} from 'jest-get-type';
import {
  BOLD_WEIGHT,
  EXPECTED_COLOR,
  INVERTED_COLOR,
  MatcherHintOptions,
  RECEIVED_COLOR,
  getLabelPrinter,
  matcherHint,
  replaceMatchedToAsymmetricMatcher,
} from 'jest-matcher-utils';
import {format as prettyFormat} from 'pretty-format';
import {
  aBackground2,
  aBackground3,
  aForeground2,
  aForeground3,
  bBackground2,
  bBackground3,
  bForeground2,
  bForeground3,
} from './colors';
import {dedentLines} from './dedentLines';
import type {MatchSnapshotConfig, SnapshotFormat} from './types';
import {deserializeString, minify, serialize} from './utils';

type Chalk = chalk.Chalk;

export const getSnapshotColorForChalkInstance = (
  chalkInstance: Chalk,
): DiffOptionsColor => {
  const level = chalkInstance.level;

  if (level === 3) {
    return chalkInstance
      .rgb(aForeground3[0], aForeground3[1], aForeground3[2])
      .bgRgb(aBackground3[0], aBackground3[1], aBackground3[2]);
  }

  if (level === 2) {
    return chalkInstance.ansi256(aForeground2).bgAnsi256(aBackground2);
  }

  return chalkInstance.magenta.bgYellowBright;
};

export const getReceivedColorForChalkInstance = (
  chalkInstance: Chalk,
): DiffOptionsColor => {
  const level = chalkInstance.level;

  if (level === 3) {
    return chalkInstance
      .rgb(bForeground3[0], bForeground3[1], bForeground3[2])
      .bgRgb(bBackground3[0], bBackground3[1], bBackground3[2]);
  }

  if (level === 2) {
    return chalkInstance.ansi256(bForeground2).bgAnsi256(bBackground2);
  }

  return chalkInstance.cyan.bgWhiteBright; // also known as teal
};

export const aSnapshotColor = getSnapshotColorForChalkInstance(chalk);
export const bReceivedColor = getReceivedColorForChalkInstance(chalk);

export const noColor = (string: string): string => string;

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
  if (isUpdatable) {
    options.receivedColor = bReceivedColor;
  }

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
      if (isUpdatable) {
        options.secondArgumentColor = aSnapshotColor;
      } else {
        options.secondArgumentColor = noColor;
      }
    }
  } else {
    if (typeof hint === 'string' && hint.length !== 0) {
      expectedArgument = HINT_ARG;
      options.expectedColor = BOLD_WEIGHT;
    } else if (typeof inlineSnapshot === 'string') {
      expectedArgument = SNAPSHOT_ARG;
      if (isUpdatable) {
        options.expectedColor = aSnapshotColor;
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

const isLineDiffable = (received: unknown): boolean => {
  const receivedType = getType(received);

  if (isPrimitive(received)) {
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

export const printExpected = (val: unknown): string =>
  EXPECTED_COLOR(minify(val));
export const printReceived = (val: unknown): string =>
  RECEIVED_COLOR(minify(val));

export const printPropertiesAndReceived = (
  properties: object,
  received: object,
  expand: boolean, // CLI options: true if `--expand` or false if `--no-expand`
): string => {
  const aAnnotation = 'Expected properties';
  const bAnnotation = 'Received value';

  if (isLineDiffable(properties) && isLineDiffable(received)) {
    const {replacedExpected, replacedReceived} =
      replaceMatchedToAsymmetricMatcher(properties, received, [], []);
    return diffLinesUnified(
      serialize(replacedExpected).split('\n'),
      serialize(getObjectSubset(replacedReceived, replacedExpected)).split(
        '\n',
      ),
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
  return `${printLabel(aAnnotation) + printExpected(properties)}\n${printLabel(
    bAnnotation,
  )}${printReceived(received)}`;
};

const MAX_DIFF_STRING_LENGTH = 20000;

export const printSnapshotAndReceived = (
  a: string, // snapshot without extra line breaks
  b: string, // received serialized but without extra line breaks
  received: unknown,
  expand: boolean, // CLI options: true if `--expand` or false if `--no-expand`
  snapshotFormat?: SnapshotFormat,
): string => {
  const aAnnotation = 'Snapshot';
  const bAnnotation = 'Received';
  const aColor = aSnapshotColor;
  const bColor = bReceivedColor;
  const options = {
    aAnnotation,
    aColor,
    bAnnotation,
    bColor,
    changeLineTrailingSpaceColor: noColor,
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
          aQuoted = `"${joinDiffs(diffs, DIFF_DELETE, hasCommon)}"`;
          bQuoted = `"${joinDiffs(diffs, DIFF_INSERT, hasCommon)}"`;
        }

        const printLabel = getLabelPrinter(aAnnotation, bAnnotation);
        return `${printLabel(aAnnotation) + aColor(aQuoted)}\n${printLabel(
          bAnnotation,
        )}${bColor(bQuoted)}`;
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
    const aLines2 = a.split('\n');
    const bLines2 = b.split('\n');

    // Fall through to fix a regression for custom serializers
    // like jest-snapshot-serializer-raw that ignore the indent option.
    const b0 = serialize(received, 0, snapshotFormat);
    if (b0 !== b) {
      const aLines0 = dedentLines(aLines2);

      if (aLines0 !== null) {
        // Compare lines without indentation.
        const bLines0 = b0.split('\n');

        return diffLinesUnified2(aLines2, bLines2, aLines0, bLines0, options);
      }
    }

    // Fall back because:
    // * props include a multiline string
    // * text has more than one adjacent line
    // * markup does not close
    return diffLinesUnified(aLines2, bLines2, options);
  }

  const printLabel = getLabelPrinter(aAnnotation, bAnnotation);
  return `${printLabel(aAnnotation) + aColor(a)}\n${printLabel(
    bAnnotation,
  )}${bColor(b)}`;
};
