import {isKindEqual} from '../diffObject';
import {createCommonLine, createDeletedLine, createInsertedLine} from '../line';
import {Format} from '../types';

export const circularVal = Symbol('circularVal');

export interface WrappedCircularObject {
  [circularVal]: unknown;
  circularToDepth?: number;
}

function wrapCircularObject(
  obj: unknown,
  circularToDepth: number,
): WrappedCircularObject {
  return {
    circularToDepth,
    [circularVal]: obj,
  };
}

export function wrapIfHasCircularity<T>(
  obj: T,
  circularToDepth?: number,
): T | WrappedCircularObject {
  if (typeof circularToDepth === 'number') {
    return wrapCircularObject(obj, circularToDepth);
  }
  return obj;
}

export function isWrappedCircular(obj: unknown): obj is WrappedCircularObject {
  return obj && Object.prototype.hasOwnProperty.call(obj, circularVal);
}

const serialize = (circular: WrappedCircularObject) =>
  `[Circular to depth ${circular.circularToDepth}]`;

export const formatCircularDiff: Format = (diff, context) => {
  if (isKindEqual(diff.kind)) {
    return [createCommonLine(diff.a, context)];
  }
  return [
    createDeletedLine(diff.a, context),
    createInsertedLine(diff.b, context),
  ];
};

export const wrappedCircularSerializer = {
  serialize,
  test: isWrappedCircular,
};
