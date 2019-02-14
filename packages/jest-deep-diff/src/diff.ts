import getType = require('jest-get-type');
import {DiffObject, DiffPlugin, Memos, Path} from './types';
import {wrapIfHasCircularity} from './complex/circularObjects';
import {createEqual, createUnequalType, createUpdated} from './diffObject';
import {diffObjects} from './complex/object';
import {diffArrays} from './complex/array';
import {diffMaps} from './complex/map';
import {
  diffBooleans,
  diffDates,
  diffErrors,
  diffFunctions,
  diffNumbers,
  diffRegExps,
  diffStrings,
} from './primitives';

// eslint-disable-next-line @typescript-eslint/ban-types
type PrimitiveWrapper = String | Number | Boolean;

function diff(
  a: unknown,
  b: unknown,
  path?: Path,
  memos?: Memos,
  customDiffs: Array<DiffPlugin> = [],
): DiffObject {
  if (Object.is(a, b)) return createEqual(a, b, path);

  const diffWithCustomDiffs = (
    a: unknown,
    b: unknown,
    path?: Path,
    memos?: Memos,
  ) => diff(a, b, path, memos, customDiffs);

  for (const customDiff of customDiffs) {
    if (customDiff.test(a) || customDiff.test(b)) {
      return customDiff.diff(a, b, path, memos, diffWithCustomDiffs);
    }
  }

  const aType = getType(a);

  const bType = getType(b);
  if (aType !== bType) {
    return createUnequalType(a, b, path);
  }

  if (a instanceof Error) {
    return diffErrors(a, b as Error, path);
  }

  switch (aType) {
    case 'string':
      return diffStrings(a as string, b as string, path);
    case 'number':
      return diffNumbers(a as number, b as number, path);
    case 'boolean':
      return diffBooleans(a as boolean, b as boolean, path);
    case 'date':
      return diffDates(a as Date, b as Date, path);
    case 'regexp':
      return diffRegExps(a as RegExp, b as RegExp, path);
    case 'function':
      return diffFunctions(a as Function, b as Function, path);
  }

  // adapted from node assert
  // Use memos to handle cycles.
  if (memos === undefined) {
    memos = {
      a: new Map(),
      b: new Map(),
      position: 0,
    };
  } else {
    // We prevent up to two map.has(x) calls by directly retrieving the value
    // and checking for undefined. The map can only contain numbers, so it is
    // safe to check for undefined only.
    const bMemoA = memos.a.get(a);
    const bMemoB = memos.b.get(b);
    if (bMemoA !== undefined || bMemoB !== undefined) {
      return bMemoA === bMemoB
        ? createEqual(
            wrapIfHasCircularity(a, bMemoA),
            wrapIfHasCircularity(b, bMemoB),
            path,
          )
        : createUpdated(
            wrapIfHasCircularity(a, bMemoA),
            wrapIfHasCircularity(b, bMemoB),
            path,
          );
    }
    memos.position++;
  }

  memos.a.set(a, memos.position);
  memos.b.set(b, memos.position);

  if (!Object.is(Object.getPrototypeOf(a), Object.getPrototypeOf(b))) {
    return createUnequalType(a, b, path);
  }

  // TODO: DOM Node

  if (a instanceof Number || a instanceof String || a instanceof Boolean) {
    return Object.is(a.valueOf(), (b as PrimitiveWrapper).valueOf())
      ? createEqual(a, b, path)
      : createUpdated(a, b, path);
  }

  const diffWithMemosAndCustomDiffs = (a: unknown, b: unknown, path: Path) =>
    diffWithCustomDiffs(a, b, path, memos);

  switch (aType) {
    case 'array':
      return diffArrays(
        a as Array<unknown>,
        b as Array<unknown>,
        path,
        diffWithMemosAndCustomDiffs,
      );
    case 'object':
      return diffObjects(
        a as Record<string | number | symbol, unknown>,
        b as Record<string | number | symbol, unknown>,
        path,
        diffWithMemosAndCustomDiffs,
      );
    case 'map':
      return diffMaps(
        a as Map<unknown, unknown>,
        b as Map<unknown, unknown>,
        path,
        diffWithMemosAndCustomDiffs,
      );
    // case 'set':
    //   return compareSets(a as Set<unknown>, b as Set<unknown>, path, deepDiff);
    default:
      throw new Error('oopsie ' + aType);
  }
}

export default diff;
