import {
  createDeleted,
  createInserted,
  getComplexValueDiffKind,
} from '../diffObject';
import {
  Context,
  DiffObject,
  Format,
  FormatComplexDiff,
  Line,
  LineGenerationOptions,
  Path,
} from '../types';
import {createCommonLine} from '../line';
import {getConstructorName} from './utils';

/** https://github.com/microsoft/TypeScript/issues/1863 */
export type Key = any;

function getKeys(o: object) {
  const keys: Array<string | symbol> = Object.keys(o);

  return keys.concat(
    Object.getOwnPropertySymbols(o).filter(
      symbol => Object.getOwnPropertyDescriptor(o, symbol)!.enumerable,
    ),
  );
}

export function diffObjects(
  a: Record<Key, unknown>,
  b: Record<Key, unknown>,
  path: Path,
  diffFunc: Function,
): DiffObject<Record<Key, unknown>> {
  const childDiffs = [];

  const aKeys: Array<Key | null> = getKeys(a);
  const bKeys: Array<Key | null> = getKeys(b);
  for (let i = 0; i < aKeys.length; i++) {
    const key = aKeys[i] as Key;
    /* NOTE: could use something more efficient if
    the object has many keys */
    const otherIndex = bKeys.indexOf(key);
    if (otherIndex >= 0) {
      childDiffs.push(diffFunc(a[key], b[key], key));
      bKeys[otherIndex] = null;
    } else {
      childDiffs.push(createDeleted(a[key], undefined, key));
    }
  }
  for (let i = 0; i <= bKeys.length; i++) {
    const key = bKeys[i];
    if (typeof key !== 'undefined' && key !== null) {
      childDiffs.push(createInserted(undefined, b[key], key));
    }
  }

  return {
    a,
    b,
    childDiffs,
    kind: getComplexValueDiffKind(childDiffs),
    path,
  };
}

function formatObjectProperties(
  childDiffs: Array<DiffObject<unknown, unknown>>,
  context: Readonly<Context>,
  opts: LineGenerationOptions,
  format: Format,
): Array<Line> {
  const nextContext: Context = {
    indent: context.indent + '  ',
    sufix: ',',
  };
  return childDiffs.flatMap(diff => {
    nextContext.prefix = `"${diff.path}": `;
    return format(diff, nextContext, opts);
  });
}

export const formatObjectDiff: FormatComplexDiff<Record<Key, unknown>> = (
  diff,
  context,
  opts,
  format,
) => {
  const firstLine = createCommonLine(
    getConstructorName(diff.a as Record<Key, unknown>) + ' {',
    {...context, skipSerialize: true, sufix: ''},
  );

  const formattedChildDiffs = diff.childDiffs
    ? formatObjectProperties(diff.childDiffs, context, opts, format)
    : [];

  const lastLine = createCommonLine('}', {
    ...context,
    prefix: '',
    skipSerialize: true,
  });

  return [firstLine, ...formattedChildDiffs, lastLine];
};
