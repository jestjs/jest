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

export const createUnequalType: CreateDiffObjectWithFixedKind = (a, b, path) =>
  createDiffObject(Kind.UNEQUAL_TYPE, a, b, path);

export const createEqual: CreateDiffObjectWithFixedKind = (a, b, path) =>
  createDiffObject(Kind.EQUAL, a, b, path);

export const createUpdated: CreateDiffObjectWithFixedKind = (a, b, path) =>
  createDiffObject(Kind.UPDATED, a, b, path);

export const createDeleted: CreateDiffObjectWithFixedKind = (a, b, path) =>
  createDiffObject(Kind.DELETED, a, b, path);

export const createInserted: CreateDiffObjectWithFixedKind = (a, b, path) =>
  createDiffObject(Kind.INSERTED, a, b, path);

export const isKindEqual = (kind: Kind): boolean => kind === Kind.EQUAL;

export const isKindInserted = (kind: Kind): boolean => kind === Kind.INSERTED;

export const isKindUpdated = (kind: Kind): boolean => kind === Kind.UPDATED;

export const isKindDeleted = (kind: Kind): boolean => kind === Kind.DELETED;

export const isKindUnequalType = (kind: Kind): boolean =>
  kind === Kind.UNEQUAL_TYPE;

export function getComplexValueDiffKind(
  childrenDiffs: Array<DiffObject<unknown, unknown>>,
): Kind.EQUAL | Kind.UPDATED {
  for (const diff of childrenDiffs) {
    if (!isKindEqual(diff.kind)) {
      return Kind.UPDATED;
    }
  }

  return Kind.EQUAL;
}
