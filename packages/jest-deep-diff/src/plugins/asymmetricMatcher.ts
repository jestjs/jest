/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import prettyFormat = require('pretty-format');
import {createCommonLine, createDeletedLine, createInsertedLine} from '../line';
import {CustomDiff, CustomFormat, DiffObject, Kind, Path} from '../types';

const asymmetricMatcher =
  typeof Symbol === 'function' && Symbol.for
    ? Symbol.for('jest.asymmetricMatcher')
    : 0x1357a5;

const test = (val: unknown): val is AsymmetricMatcher =>
  typeof val === 'object' &&
  val !== null &&
  (val as Record<string, unknown>).$$typeof === asymmetricMatcher;

const serializeAsymmetricMatcher = (val: AsymmetricMatcher) =>
  prettyFormat(val, {plugins: [prettyFormat.plugins.AsymmetricMatcher]});
interface AsymmetricMatcher {
  asymmetricMatch: (a: unknown) => boolean;
}

const diff: CustomDiff = (a, b, path, memos, diff, markChildrenRecursively) => {
  if (test(a)) {
    return a.asymmetricMatch(b)
      ? diff(b, b, path, memos)
      : {
          a,
          aChildDiffs: markChildrenRecursively(Kind.DELETED, a, path)
            .childDiffs,
          b,
          bChildDiffs: markChildrenRecursively(Kind.INSERTED, b, path)
            .childDiffs,
          kind: Kind.UNEQUAL_TYPE,
          path,
        };
  }

  return (b as AsymmetricMatcher).asymmetricMatch(a)
    ? diff(a, a, path, memos)
    : {
        a,
        aChildDiffs: markChildrenRecursively(Kind.DELETED, a, path).childDiffs,
        b,
        bChildDiffs: markChildrenRecursively(Kind.INSERTED, b, path).childDiffs,
        kind: Kind.UNEQUAL_TYPE,
        path,
      };
};

const format: CustomFormat = (diffObj, context, options, originalFormat) => {
  switch (diffObj.kind) {
    case Kind.EQUAL: {
      const val = test(diffObj.a) ? diffObj.b : diffObj.a;
      return [createCommonLine(options.serialize(val), context)];
    }
    case Kind.UNEQUAL_TYPE: {
      const insertedDiff: DiffObject = {
        b: diffObj.b,
        childDiffs: diffObj.bChildDiffs,
        kind: Kind.INSERTED,
        path: diffObj.path,
      };
      const deletedDiff: DiffObject = {
        a: diffObj.a,
        childDiffs: diffObj.aChildDiffs,
        kind: Kind.DELETED,
        path: diffObj.path,
      };
      return [
        ...originalFormat(deletedDiff, context, options),
        ...originalFormat(insertedDiff, context, options),
      ];
    }
    case Kind.INSERTED: {
      return [
        createInsertedLine(
          serializeAsymmetricMatcher(diffObj.b as AsymmetricMatcher),
          context,
        ),
      ];
    }
    case Kind.DELETED: {
      return [
        createDeletedLine(
          serializeAsymmetricMatcher(diffObj.a as AsymmetricMatcher),
          context,
        ),
      ];
    }
  }
  throw new Error('Assymetric matcher should never return UNEQUAL_TYPE');
};

function markChildrenRecursively(
  kind: Kind.DELETED | Kind.INSERTED,
  val: unknown,
  path: Path,
): DiffObject {
  if (kind === Kind.DELETED) {
    return {
      a: val,
      kind,
      path,
    };
  }
  return {
    b: val,
    kind,
    path,
  };
}

export default {
  diff,
  format,
  markChildrenRecursively,
  test,
};
