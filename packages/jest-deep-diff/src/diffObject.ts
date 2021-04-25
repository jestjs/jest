/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  DiffObject,
  EqualDiffObject,
  Kind,
  Path,
  UpdatedDiffObject,
} from './types';

export function createDiffObject<T1, T2>(
  kind: Kind.EQUAL | Kind.UPDATED,
  a: T1,
  b: T2,
  path: Path,
): EqualDiffObject<T1, T2> | UpdatedDiffObject<T1, T2> {
  return {
    a,
    b,
    kind,
    ...(typeof path !== 'undefined' && {path}),
  };
}

type CreateDiffObjectWithFixedKind = <T1, T2>(
  a: T1,
  b: T2,
  path: Path,
) => DiffObject<T1, T2>;

export const createEqual: CreateDiffObjectWithFixedKind = (a, b, path) =>
  createDiffObject(Kind.EQUAL, a, b, path);

export const createUpdated: CreateDiffObjectWithFixedKind = (a, b, path) =>
  createDiffObject(Kind.UPDATED, a, b, path);

export const createDeleted: CreateDiffObjectWithFixedKind = (a, _, path) => ({
  val: a,
  kind: Kind.DELETED,
  ...(typeof path !== 'undefined' && {path}),
});

export const createInserted: CreateDiffObjectWithFixedKind = (_, b, path) => ({
  kind: Kind.INSERTED,
  val: b,
  ...(typeof path !== 'undefined' && {path}),
});

export function getComplexValueDiffKind(
  childrenDiffs: Array<DiffObject<unknown, unknown>>,
): Kind.EQUAL | Kind.UPDATED {
  for (const diff of childrenDiffs) {
    if (diff.kind !== Kind.EQUAL) {
      return Kind.UPDATED;
    }
  }

  return Kind.EQUAL;
}
