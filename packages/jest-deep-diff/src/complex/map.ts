import {Context, DiffObject, FormatComplexDiff, Kind, Path} from '../types';
import {createDeleted, createInserted, isKindEqual} from '../diffObject';
import {createCommonLine} from '../line';
import {getConstructorName} from './utils';

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
    if (isKindEqual(kind) && !isKindEqual(propDiff.kind)) {
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

function formatMapEntries() {
  return [];
}

export const formatMapDiff: FormatComplexDiff<Map<unknown, unknown>> = (
  diff: DiffObject,
  context: Context,
) => {
  const firstLine = createCommonLine(
    getConstructorName(diff.a as Map<unknown, unknown>) + ' {',
    context,
  );

  const formattedChildDiffsResults = diff.childDiffs ? formatMapEntries() : [];

  const lastLine = createCommonLine('}', context);

  return [firstLine, ...formattedChildDiffsResults, lastLine];
};
