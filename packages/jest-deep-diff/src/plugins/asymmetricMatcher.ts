/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import prettyFormat = require('pretty-format');
import {createCommonLine, createDeletedLine, createInsertedLine} from '../line';
import {
  CustomDiff,
  CustomFormat,
  DeletedDiffObject,
  DiffObject,
  EqualDiffObject,
  InsertedDiffObject,
  Kind,
  MarkChildrenRecursivelyWithScopedPlugins,
  Path,
} from '../types';

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
  sample: unknown;
  inverse?: boolean;
}

const diff: CustomDiff = (a, b, path, memos, diff, markChildrenRecursively) => {
  const matcher = (test(a) ? a : b) as AsymmetricMatcher;
  const other = test(a) ? b : a;

  const isMatch = matcher.asymmetricMatch(other);
  const matcherName = matcher.toString();
  console.log(matcherName);

  if (
    matcherName === 'ObjectContaining' ||
    matcherName === 'ObjectNotContaining'
  ) {
    if (isMatch) {
      return diff(other, other, path, memos);
    } else {
      const c = diff(
        matcher === a ? matcher.sample : a,
        matcher === b ? matcher.sample : b,
        path,
        memos,
      );
      if (c.kind === Kind.UNEQUAL_TYPE) {
        return {
          ...c,
          a,
          b,
        };
      }
      if (c.kind === Kind.UPDATED) {
        return {
          ...c,
          childDiffs: c.childDiffs?.map(childDiff => {
            const hasKey =
              (childDiff.path as string) in
              (matcher.sample as Record<string, unknown>);
            console.log(childDiff);
            if (matcher.inverse ? !hasKey : hasKey) {
              return childDiff;
            } else {
              const equalDiff = {
                ...childDiff,
                a: Object.prototype.hasOwnProperty.call(childDiff, 'a')
                  ? (childDiff as {a: unknown}).a
                  : (childDiff as {b: unknown}).b,
                b: Object.prototype.hasOwnProperty.call(childDiff, 'b')
                  ? (childDiff as {b: unknown}).b
                  : (childDiff as {a: unknown}).a,
                kind: Kind.EQUAL,
              } as EqualDiffObject;

              return equalDiff;
            }
          }),
        };
      }

      throw new Error('Unexpected Error,');
    }
  }

  return isMatch
    ? diff(other, other, path, memos)
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
    case Kind.UPDATED: {
      if (test(diffObj.a)) {
        diffObj.a = diffObj.a.sample;
      }
      if (test(diffObj.b)) {
        diffObj.b = diffObj.b.sample;
      }

      return originalFormat(diffObj, context, options);
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
      const name = (diffObj.b as AsymmetricMatcher).toString();
      if (name === 'ObjectContaining' || name === 'ObjectNotContaining') {
        const lines = originalFormat(
          {...diffObj, b: (diffObj.b as AsymmetricMatcher).sample},
          context,
          options,
        );
        lines.shift();

        const firstLine = createInsertedLine('ObjectContaining {', {
          ...context,
          sufix: '',
        });

        return [firstLine, ...lines];
      }
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
};

function markChildrenRecursively(
  kind: Kind.DELETED | Kind.INSERTED,
  val: unknown,
  path: Path,
  refs: Set<unknown>,
  markChildrenRecursivelyWithScopedPlugins: MarkChildrenRecursivelyWithScopedPlugins,
): InsertedDiffObject | DeletedDiffObject {
  if (!test(val)) throw new Error('value must be an asymmetric matcher');

  if (kind === Kind.DELETED) {
    if (
      val.toString() === 'ObjectContaining' ||
      val.toString() === 'ObjectNotContaining'
    ) {
      return {
        ...markChildrenRecursivelyWithScopedPlugins(
          kind,
          val.sample,
          path,
          refs,
        ),
        a: val,
      };
    }
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
