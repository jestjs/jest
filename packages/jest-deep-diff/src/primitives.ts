/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import diffSequence from 'diff-sequences';
import {
  createDeleted,
  createEqual,
  createInserted,
  createUpdated,
  getComplexValueDiffKind,
} from './diffObject';
import {
  createCommonLine,
  createDeletedLine,
  createInsertedLine,
  formatUpdated,
} from './line';
import {DiffObject, FormatPrimitives, Kind, Path} from './types';

type DiffPrimitive<T1 = unknown, T2 = T1> = (
  a: T1,
  b: T2,
  path: Path,
) => DiffObject<T1, T2>;

export const emptyValue = Symbol('@jest-deep-diff/emptyValue');

const compareErrors = (a: Error, b: Error) => a.message == b.message;

export const diffErrors: DiffPrimitive<Error, Error> = (a, b, path) => {
  if (compareErrors(a, b)) return createEqual(a, b, path);
  return createUpdated(a, b, path);
};

// eslint-disable-next-line @typescript-eslint/ban-types
const compareFunctions = (a: Function, b: Function) => Object.is(a, b);

// eslint-disable-next-line @typescript-eslint/ban-types
export const diffFunctions: DiffPrimitive<Function, Function> = (a, b, path) =>
  compareFunctions(a, b) ? createEqual(a, b, path) : createUpdated(a, b, path);

const compareRegExps = (a: RegExp, b: RegExp) =>
  Object.is(a.source, b.source) && Object.is(a.flags, b.flags);

export const diffRegExps: DiffPrimitive<RegExp, RegExp> = (a, b, path) =>
  compareRegExps(a, b) ? createEqual(a, b, path) : createUpdated(a, b, path);

const compareDates = (a: Date, b: Date) => +a == +b;

export const diffDates: DiffPrimitive<Date, Date> = (a, b, path) =>
  compareDates(a, b) ? createEqual(a, b, path) : createUpdated(a, b, path);

const compareBooleans = (a: boolean, b: boolean) => Object.is(a, b);

export const diffBooleans: DiffPrimitive<boolean, boolean> = (a, b, path) =>
  compareBooleans(a, b) ? createEqual(a, b, path) : createUpdated(a, b, path);

const compareNumbers = (a: number, b: number) => Object.is(a, b);

export const diffNumbers: DiffPrimitive<number, number> = (a, b, path) =>
  compareNumbers(a, b) ? createEqual(a, b, path) : createUpdated(a, b, path);

export const formatPrimitiveDiff: FormatPrimitives = (diff, context, opts) => {
  if (diff.kind === Kind.EQUAL) {
    return [createCommonLine(opts.serialize(diff.a), context)];
  }
  return formatUpdated(opts.serialize(diff.a), opts.serialize(diff.b), context);
};

export const splitLines0 = (string: string): Array<string> =>
  string.length === 0 ? [] : string.split('\n');

// adapted from jest-diff
const diffLinesRaw = (
  aLines: Array<string>,
  bLines: Array<string>,
): Array<DiffObject> => {
  const aLength = aLines.length;
  const bLength = bLines.length;

  const isCommon = (aIndex: number, bIndex: number) =>
    aLines[aIndex] === bLines[bIndex];

  const diffs: Array<DiffObject> = [];
  let aIndex = 0;
  let bIndex = 0;

  const foundSubsequence = (
    nCommon: number,
    aCommon: number,
    bCommon: number,
  ) => {
    for (; aIndex !== aCommon; aIndex += 1) {
      diffs.push(createDeleted(aLines[aIndex], undefined, undefined));
    }
    for (; bIndex !== bCommon; bIndex += 1) {
      diffs.push(createInserted(undefined, bLines[bIndex], undefined));
    }
    for (; nCommon !== 0; nCommon -= 1, aIndex += 1, bIndex += 1) {
      diffs.push(createEqual(bLines[bIndex], bLines[bIndex], undefined));
    }
  };

  diffSequence(aLength, bLength, isCommon, foundSubsequence);

  // After the last common subsequence, push remaining change items.
  for (; aIndex !== aLength; aIndex += 1) {
    diffs.push(createDeleted(aLines[aIndex], undefined, undefined));
  }
  for (; bIndex !== bLength; bIndex += 1) {
    diffs.push(createInserted(undefined, bLines[bIndex], undefined));
  }

  return diffs;
};

export const diffStrings: DiffPrimitive<string, string> = (a, b, path) => {
  const aLines = splitLines0(a);
  const bLines = splitLines0(b);
  if (aLines.length === 1 && bLines.length === 1) {
    if (Object.is(a, b)) {
      return createEqual(a, b, path);
    }
    return createUpdated(a, b, path);
  }
  const childrenDiffs = diffLinesRaw(aLines, bLines);
  return {
    a,
    b,
    childDiffs: childrenDiffs,
    kind: getComplexValueDiffKind(childrenDiffs),
    path,
  };
};

const stringQuote = '"';

export const formatStringDiff: FormatPrimitives<string, string> = (
  diff,
  context,
  opts,
) => {
  const serializer =
    typeof diff.path === 'undefined' ? (id: string) => id : opts.serialize;
  if (diff.kind === Kind.EQUAL) {
    return [createCommonLine(serializer(diff.a as string), context)];
  }

  if (!diff.childDiffs)
    return formatUpdated(
      serializer(diff.a) as string,
      serializer(diff.b) as string,
      context,
    );

  return diff.childDiffs.map((childDiff, i, arr) => {
    let prefix = '';
    let sufix = '';
    if (typeof diff.path !== 'undefined') {
      if (i === 0) {
        prefix = stringQuote;
      }
      if (i === arr.length - 1) {
        sufix = stringQuote;
      }
    }

    if (childDiff.kind === Kind.INSERTED) {
      return createInsertedLine(prefix + childDiff.val + sufix, context);
    }

    if (childDiff.kind === Kind.DELETED) {
      return createDeletedLine(prefix + childDiff.val, context);
    }

    const a = prefix + (childDiff.a as string) + sufix;
    if (childDiff.kind === Kind.EQUAL) {
      return createCommonLine(a as string, context);
    }

    throw new Error(`Unknown diff result ${childDiff.kind}`);
  });
};
