import {createDeleted, createInserted, isKindEqual} from '../diffObject';
import {
  Context,
  DiffFunc,
  DiffObject,
  Format,
  FormatComplexDiff,
  Kind,
  LineGenerationOptions,
  Path,
} from '../types';
import {createCommonLine} from '../line';
import {getConstructorName} from './utils';

export function diffArrays(
  a: Array<unknown>,
  b: Array<unknown>,
  path: Path,
  diff: DiffFunc<unknown, unknown>,
): DiffObject<Array<unknown>> {
  let kind = Kind.EQUAL;
  const childDiffs = [];
  let aIndex = a.length - 1;
  let bIndex = b.length - 1;
  while (aIndex > bIndex) {
    kind = Kind.UPDATED;
    childDiffs.push(createDeleted(a[aIndex], undefined, aIndex));
    aIndex--;
  }
  while (bIndex > aIndex) {
    kind = Kind.UPDATED;
    childDiffs.push(createInserted(undefined, b[bIndex], bIndex));
    bIndex--;
  }
  while (aIndex >= 0) {
    const propDiff = diff(a[aIndex], b[aIndex], aIndex);
    childDiffs.push(propDiff);
    if (isKindEqual(kind) && !isKindEqual(propDiff.kind)) {
      kind = Kind.UPDATED;
    }
    aIndex--;
  }

  return {
    a,
    b,
    childDiffs: childDiffs.reverse(),
    kind,
    path,
  };
}

function formatArrayProperties(
  childDiffs: Array<DiffObject>,
  context: Readonly<Context>,
  opts: LineGenerationOptions,
  format: Format,
) {
  const nextContext = {
    indent: context.indent + '  ',
    sufix: ',',
  };
  return childDiffs.flatMap(diff => format(diff, nextContext, opts));
}

export const formatArrayDiff: FormatComplexDiff<Array<unknown>> = (
  diff,
  context,
  opts,
  format,
) => {
  const firstLine = createCommonLine(
    getConstructorName(diff.a as Array<unknown>) + ' [',
    {...context, skipSerialize: true, sufix: ''},
  );

  const formattedChildDiffs = diff.childDiffs
    ? formatArrayProperties(diff.childDiffs, context, opts, format)
    : [];

  const lastLine = createCommonLine(']', {
    ...context,
    prefix: '',
    skipSerialize: true,
  });

  return [firstLine, ...formattedChildDiffs, lastLine];
};
