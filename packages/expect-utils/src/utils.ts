/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {isPrimitive} from 'jest-get-type';
import {
  isImmutableList,
  isImmutableOrderedKeyed,
  isImmutableOrderedSet,
  isImmutableRecord,
  isImmutableUnorderedKeyed,
  isImmutableUnorderedSet,
} from './immutableUtils';
import {equals, isA} from './jasmineUtils';
import type {Tester} from './types';

type GetPath = {
  hasEndProp?: boolean;
  endPropIsDefined?: boolean;
  lastTraversedObject: unknown;
  traversedPath: Array<string>;
  value?: unknown;
};

/**
 * Checks if `hasOwnProperty(object, key)` up the prototype chain, stopping at `Object.prototype`.
 */
const hasPropertyInObject = (object: object, key: string | symbol): boolean => {
  const shouldTerminate =
    !object || typeof object !== 'object' || object === Object.prototype;

  if (shouldTerminate) {
    return false;
  }

  return (
    Object.prototype.hasOwnProperty.call(object, key) ||
    hasPropertyInObject(Object.getPrototypeOf(object), key)
  );
};

// Retrieves an object's keys for evaluation by getObjectSubset.  This evaluates
// the prototype chain for string keys but not for non-enumerable symbols.
// (Otherwise, it could find values such as a Set or Map's Symbol.toStringTag,
// with unexpected results.)
export const getObjectKeys = (object: object): Array<string | symbol> => {
  return [
    ...Object.keys(object),
    ...Object.getOwnPropertySymbols(object).filter(
      s => Object.getOwnPropertyDescriptor(object, s)?.enumerable,
    ),
  ];
};

export const getPath = (
  object: Record<string, any>,
  propertyPath: string | Array<string>,
): GetPath => {
  if (!Array.isArray(propertyPath)) {
    propertyPath = pathAsArray(propertyPath);
  }

  if (propertyPath.length > 0) {
    const lastProp = propertyPath.length === 1;
    const prop = propertyPath[0];
    const newObject = object[prop];

    if (!lastProp && (newObject === null || newObject === undefined)) {
      // This is not the last prop in the chain. If we keep recursing it will
      // hit a `can't access property X of undefined | null`. At this point we
      // know that the chain has broken and we can return right away.
      return {
        hasEndProp: false,
        lastTraversedObject: object,
        traversedPath: [],
      };
    }

    const result = getPath(newObject, propertyPath.slice(1));

    if (result.lastTraversedObject === null) {
      result.lastTraversedObject = object;
    }

    result.traversedPath.unshift(prop);

    if (lastProp) {
      // Does object have the property with an undefined value?
      // Although primitive values support bracket notation (above)
      // they would throw TypeError for in operator (below).
      result.endPropIsDefined = !isPrimitive(object) && prop in object;
      result.hasEndProp = newObject !== undefined || result.endPropIsDefined;

      if (!result.hasEndProp) {
        result.traversedPath.shift();
      }
    }

    return result;
  }

  return {
    lastTraversedObject: null,
    traversedPath: [],
    value: object,
  };
};

// Strip properties from object that are not present in the subset. Useful for
// printing the diff for toMatchObject() without adding unrelated noise.
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const getObjectSubset = (
  object: any,
  subset: any,
  customTesters: Array<Tester> = [],
  seenReferences: WeakMap<object, boolean> = new WeakMap(),
): any => {
  /* eslint-enable @typescript-eslint/explicit-module-boundary-types */
  if (Array.isArray(object)) {
    if (Array.isArray(subset) && subset.length === object.length) {
      // The map method returns correct subclass of subset.
      return subset.map((sub: any, i: number) =>
        getObjectSubset(object[i], sub, customTesters),
      );
    }
  } else if (object instanceof Date) {
    return object;
  } else if (isObject(object) && isObject(subset)) {
    if (
      equals(object, subset, [
        ...customTesters,
        iterableEquality,
        subsetEquality,
      ])
    ) {
      // Avoid unnecessary copy which might return Object instead of subclass.
      return subset;
    }

    const trimmed: any = {};
    seenReferences.set(object, trimmed);

    for (const key of getObjectKeys(object).filter(key =>
      hasPropertyInObject(subset, key),
    )) {
      trimmed[key] = seenReferences.has(object[key])
        ? seenReferences.get(object[key])
        : getObjectSubset(
            object[key],
            subset[key],
            customTesters,
            seenReferences,
          );
    }

    if (getObjectKeys(trimmed).length > 0) {
      return trimmed;
    }
  }
  return object;
};

const IteratorSymbol = Symbol.iterator;

const hasIterator = (object: any) =>
  !!(object != null && object[IteratorSymbol]);

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const iterableEquality = (
  a: any,
  b: any,
  customTesters: Array<Tester> = [],
  /* eslint-enable @typescript-eslint/explicit-module-boundary-types */
  aStack: Array<any> = [],
  bStack: Array<any> = [],
): boolean | undefined => {
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    Array.isArray(a) ||
    Array.isArray(b) ||
    !hasIterator(a) ||
    !hasIterator(b)
  ) {
    return undefined;
  }
  if (a.constructor !== b.constructor) {
    return false;
  }
  let length = aStack.length;
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    // circular references at same depth are equal
    // circular reference is not equal to non-circular one
    if (aStack[length] === a) {
      return bStack[length] === b;
    }
  }
  aStack.push(a);
  bStack.push(b);

  const iterableEqualityWithStack = (a: any, b: any) =>
    iterableEquality(
      a,
      b,
      [...filteredCustomTesters],
      [...aStack],
      [...bStack],
    );

  // Replace any instance of iterableEquality with the new
  // iterableEqualityWithStack so we can do circular detection
  const filteredCustomTesters: Array<Tester> = [
    ...customTesters.filter(t => t !== iterableEquality),
    iterableEqualityWithStack,
  ];

  if (a.size !== undefined) {
    if (a.size !== b.size) {
      return false;
    } else if (isA<Set<unknown>>('Set', a) || isImmutableUnorderedSet(a)) {
      let allFound = true;
      for (const aValue of a) {
        if (!b.has(aValue)) {
          let has = false;
          for (const bValue of b) {
            const isEqual = equals(aValue, bValue, filteredCustomTesters);
            if (isEqual === true) {
              has = true;
            }
          }

          if (has === false) {
            allFound = false;
            break;
          }
        }
      }
      // Remove the first value from the stack of traversed values.
      aStack.pop();
      bStack.pop();
      return allFound;
    } else if (
      isA<Map<unknown, unknown>>('Map', a) ||
      isImmutableUnorderedKeyed(a)
    ) {
      let allFound = true;
      for (const aEntry of a) {
        if (
          !b.has(aEntry[0]) ||
          !equals(aEntry[1], b.get(aEntry[0]), filteredCustomTesters)
        ) {
          let has = false;
          for (const bEntry of b) {
            const matchedKey = equals(
              aEntry[0],
              bEntry[0],
              filteredCustomTesters,
            );

            let matchedValue = false;
            if (matchedKey === true) {
              matchedValue = equals(
                aEntry[1],
                bEntry[1],
                filteredCustomTesters,
              );
            }
            if (matchedValue === true) {
              has = true;
            }
          }

          if (has === false) {
            allFound = false;
            break;
          }
        }
      }
      // Remove the first value from the stack of traversed values.
      aStack.pop();
      bStack.pop();
      return allFound;
    }
  }

  const bIterator = b[IteratorSymbol]();

  for (const aValue of a) {
    const nextB = bIterator.next();
    if (nextB.done || !equals(aValue, nextB.value, filteredCustomTesters)) {
      return false;
    }
  }
  if (!bIterator.next().done) {
    return false;
  }

  if (
    !isImmutableList(a) &&
    !isImmutableOrderedKeyed(a) &&
    !isImmutableOrderedSet(a) &&
    !isImmutableRecord(a)
  ) {
    const aEntries = entries(a);
    const bEntries = entries(b);
    if (!equals(aEntries, bEntries)) {
      return false;
    }
  }

  // Remove the first value from the stack of traversed values.
  aStack.pop();
  bStack.pop();
  return true;
};

const entries = (obj: any) => {
  if (!isObject(obj)) return [];

  const symbolProperties = Object.getOwnPropertySymbols(obj)
    .filter(key => key !== Symbol.iterator)
    .map(key => [key, obj[key]]);

  return [...symbolProperties, ...Object.entries(obj)];
};

const isObject = (a: any) => a !== null && typeof a === 'object';

const isObjectWithKeys = (a: any) =>
  isObject(a) &&
  !(a instanceof Error) &&
  !Array.isArray(a) &&
  !(a instanceof Date) &&
  !(a instanceof Set) &&
  !(a instanceof Map);

export const subsetEquality = (
  object: unknown,
  subset: unknown,
  customTesters: Array<Tester> = [],
): boolean | undefined => {
  const filteredCustomTesters = customTesters.filter(t => t !== subsetEquality);

  // subsetEquality needs to keep track of the references
  // it has already visited to avoid infinite loops in case
  // there are circular references in the subset passed to it.
  const subsetEqualityWithContext =
    (seenReferences: WeakMap<object, boolean> = new WeakMap()) =>
    (object: any, subset: any): boolean | undefined => {
      if (!isObjectWithKeys(subset)) {
        return undefined;
      }

      if (seenReferences.has(subset)) return undefined;
      seenReferences.set(subset, true);

      const matchResult = getObjectKeys(subset).every(key => {
        if (isObjectWithKeys(subset[key])) {
          if (seenReferences.has(subset[key])) {
            return equals(object[key], subset[key], filteredCustomTesters);
          }
        }
        const result =
          object != null &&
          hasPropertyInObject(object, key) &&
          equals(object[key], subset[key], [
            ...filteredCustomTesters,
            subsetEqualityWithContext(seenReferences),
          ]);
        // The main goal of using seenReference is to avoid circular node on tree.
        // It will only happen within a parent and its child, not a node and nodes next to it (same level)
        // We should keep the reference for a parent and its child only
        // Thus we should delete the reference immediately so that it doesn't interfere
        // other nodes within the same level on tree.
        seenReferences.delete(subset[key]);
        return result;
      });
      seenReferences.delete(subset);
      return matchResult;
    };

  return subsetEqualityWithContext()(object, subset);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const typeEquality = (a: any, b: any): boolean | undefined => {
  if (
    a == null ||
    b == null ||
    a.constructor === b.constructor ||
    // Since Jest globals are different from Node globals,
    // constructors are different even between arrays when comparing properties of mock objects.
    // Both of them should be able to compare correctly when they are array-to-array.
    // https://github.com/jestjs/jest/issues/2549
    (Array.isArray(a) && Array.isArray(b))
  ) {
    return undefined;
  }

  return false;
};

export const arrayBufferEquality = (
  a: unknown,
  b: unknown,
): boolean | undefined => {
  let dataViewA = a;
  let dataViewB = b;

  if (a instanceof ArrayBuffer && b instanceof ArrayBuffer) {
    dataViewA = new DataView(a);
    dataViewB = new DataView(b);
  }

  if (!(dataViewA instanceof DataView && dataViewB instanceof DataView)) {
    return undefined;
  }

  // Buffers are not equal when they do not have the same byte length
  if (dataViewA.byteLength !== dataViewB.byteLength) {
    return false;
  }

  // Check if every byte value is equal to each other
  for (let i = 0; i < dataViewA.byteLength; i++) {
    if (dataViewA.getUint8(i) !== dataViewB.getUint8(i)) {
      return false;
    }
  }

  return true;
};

export const sparseArrayEquality = (
  a: unknown,
  b: unknown,
  customTesters: Array<Tester> = [],
): boolean | undefined => {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return undefined;
  }

  // A sparse array [, , 1] will have keys ["2"] whereas [undefined, undefined, 1] will have keys ["0", "1", "2"]
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    equals(
      a,
      b,
      customTesters.filter(t => t !== sparseArrayEquality),
      true,
    ) && equals(aKeys, bKeys)
  );
};

export const partition = <T>(
  items: Array<T>,
  predicate: (arg: T) => boolean,
): [Array<T>, Array<T>] => {
  const result: [Array<T>, Array<T>] = [[], []];

  for (const item of items) result[predicate(item) ? 0 : 1].push(item);

  return result;
};

export const pathAsArray = (propertyPath: string): Array<any> => {
  const properties: Array<string> = [];

  if (propertyPath === '') {
    properties.push('');
    return properties;
  }

  // will match everything that's not a dot or a bracket, and "" for consecutive dots.
  const pattern = new RegExp('[^.[\\]]+|(?=(?:\\.)(?:\\.|$))', 'g');

  // Because the regex won't match a dot in the beginning of the path, if present.
  if (propertyPath[0] === '.') {
    properties.push('');
  }

  propertyPath.replaceAll(pattern, match => {
    properties.push(match);
    return match;
  });

  return properties;
};

// Copied from https://github.com/graingert/angular.js/blob/a43574052e9775cbc1d7dd8a086752c979b0f020/src/Angular.js#L685-L693
export const isError = (value: unknown): value is Error => {
  switch (Object.prototype.toString.call(value)) {
    case '[object Error]':
    case '[object Exception]':
    case '[object DOMException]':
      return true;
    default:
      return value instanceof Error;
  }
};

export function emptyObject(obj: unknown): boolean {
  return obj && typeof obj === 'object' ? Object.keys(obj).length === 0 : false;
}

const MULTILINE_REGEXP = /[\n\r]/;

export const isOneline = (expected: unknown, received: unknown): boolean =>
  typeof expected === 'string' &&
  typeof received === 'string' &&
  (!MULTILINE_REGEXP.test(expected) || !MULTILINE_REGEXP.test(received));
