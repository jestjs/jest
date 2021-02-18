import {createDeleted, createInserted} from '../diffObject';
import {createCommonLine} from '../line';
import {Context, DiffObject, FormatComplexDiff, Kind, Path} from '../types';

// Maps Diff and Format are not fully implemented yet
export function diffMaps(
  a: Map<unknown, unknown>,
  b: Map<unknown, unknown>,
  path: Path,
  diffFunc: (a: unknown, b: unknown, path?: any) => DiffObject,
): DiffObject {
  let kind = Kind.EQUAL;

  if (a.size !== b.size) {
    kind = Kind.UPDATED;
  }

  const childDiffs = [];

  const aEntries = [...a.entries()];
  const bEntries = [...b.entries()];

  let aIndex = aEntries.length - 1;
  let bIndex = bEntries.length - 1;
  while (aIndex > bIndex) {
    kind = Kind.UPDATED;
    childDiffs.push(
      createDeleted(aEntries[aIndex][1], undefined, aEntries[aIndex][0]),
    );
    aIndex--;
  }
  while (bIndex > aIndex) {
    kind = Kind.UPDATED;
    childDiffs.push(
      createInserted(undefined, bEntries[bIndex][1], bEntries[bIndex][0]),
    );
    bIndex--;
  }
  while (aIndex >= 0) {
    const propDiff = diffFunc(aEntries[aIndex], bEntries[aIndex], aIndex);
    childDiffs.push(propDiff);
    if (kind === Kind.EQUAL && propDiff.kind !== Kind.EQUAL) {
      kind = Kind.UPDATED;
    }
    aIndex--;
  }
  const diff: DiffObject = {
    a,
    b,
    kind,
    path,
    ...(kind !== Kind.EQUAL && {
      childDiffs: childDiffs.reverse(),
    }),
    ...(kind !== Kind.EQUAL && {}),
  };

  return diff;
}

export const formatMapDiff: FormatComplexDiff<Map<unknown, unknown>> = (
  diff: DiffObject,
  context: Context,
) => {
  if (diff.kind === Kind.EQUAL) {
    return [
      createCommonLine('Map {', {
        ...context,
        sufix: '',
      }),
      createCommonLine('}', {
        ...context,
        prefix: '',
      }),
    ];
  } else {
    // TODO: implement Map diff
    throw new Error('Map formatting is not implemented yet');
  }
};
