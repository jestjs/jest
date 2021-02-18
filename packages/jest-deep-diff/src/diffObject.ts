import {DiffObject, Kind, Path} from './types';

export function createDiffObject<T1, T2>(
  kind: Kind,
  a: T1,
  b: T2,
  path: Path,
): DiffObject<T1, T2> {
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

export const createDeleted: CreateDiffObjectWithFixedKind = (a, b, path) =>
  createDiffObject(Kind.DELETED, a, b, path);

export const createInserted: CreateDiffObjectWithFixedKind = (a, b, path) =>
  createDiffObject(Kind.INSERTED, a, b, path);

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
