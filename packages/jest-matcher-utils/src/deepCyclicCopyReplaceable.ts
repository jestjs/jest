/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {plugins} from 'pretty-format';

const builtInObject: Array<unknown> = [
  Array,
  Date,
  Float32Array,
  Float64Array,
  Int16Array,
  Int32Array,
  Int8Array,
  Map,
  Set,
  RegExp,
  Uint16Array,
  Uint32Array,
  Uint8Array,
  Uint8ClampedArray,
];

if (typeof Buffer !== 'undefined') {
  builtInObject.push(Buffer);
}

export const SERIALIZABLE_PROPERTIES = Symbol.for(
  '@jest/serializableProperties',
);

const isBuiltInObject = (object: any) =>
  builtInObject.includes(object.constructor);

const isMap = (value: any): value is Map<unknown, unknown> =>
  value.constructor === Map;

export default function deepCyclicCopyReplaceable<T>(
  value: T,
  cycles = new WeakMap<any, any>(),
): T {
  if (typeof value !== 'object' || value === null) {
    return value;
  } else if (cycles.has(value)) {
    return cycles.get(value);
  } else if (Array.isArray(value)) {
    return deepCyclicCopyArray(value, cycles);
  } else if (isMap(value)) {
    return deepCyclicCopyMap(value, cycles);
  } else if (isBuiltInObject(value)) {
    return value;
  } else if (plugins.DOMElement.test(value)) {
    return (value as unknown as Element).cloneNode(true) as unknown as T;
  } else {
    return deepCyclicCopyObject(value, cycles);
  }
}

function deepCyclicCopyObject<T>(object: T, cycles: WeakMap<any, unknown>): T {
  const newObject = Object.create(Object.getPrototypeOf(object));
  let descriptors: Record<string | symbol, PropertyDescriptor> = {};
  let obj = object;
  do {
    const serializableProperties = getSerializableProperties(obj);

    if (serializableProperties === undefined) {
      descriptors = Object.assign(
        {},
        Object.getOwnPropertyDescriptors(obj),
        descriptors,
      );
    } else {
      for (const property of serializableProperties) {
        if (!descriptors[property]) {
          descriptors[property] = Object.getOwnPropertyDescriptor(
            obj,
            property,
          )!;
        }
      }
    }
  } while (
    (obj = Object.getPrototypeOf(obj)) &&
    obj !== Object.getPrototypeOf({})
  );

  cycles.set(object, newObject);

  const newDescriptors = [
    ...Object.keys(descriptors),
    ...Object.getOwnPropertySymbols(descriptors),
  ].reduce(
    //@ts-expect-error because typescript do not support symbol key in object
    //https://github.com/microsoft/TypeScript/issues/1863
    (newDescriptors: {[x: string]: PropertyDescriptor}, key: string) => {
      const enumerable = descriptors[key].enumerable;

      newDescriptors[key] = {
        configurable: true,
        enumerable,
        value: deepCyclicCopyReplaceable(
          // this accesses the value or getter, depending. We just care about the value anyways, and this allows us to not mess with accessors
          // it has the side effect of invoking the getter here though, rather than copying it over
          (object as Record<string | symbol, unknown>)[key],
          cycles,
        ),
        writable: true,
      };
      return newDescriptors;
    },
    {},
  );
  //@ts-expect-error because typescript do not support symbol key in object
  //https://github.com/microsoft/TypeScript/issues/1863
  return Object.defineProperties(newObject, newDescriptors);
}

function deepCyclicCopyArray<T>(
  array: Array<T>,
  cycles: WeakMap<any, unknown>,
): T {
  const newArray = new (Object.getPrototypeOf(array).constructor)(array.length);
  const length = array.length;

  cycles.set(array, newArray);

  for (let i = 0; i < length; i++) {
    newArray[i] = deepCyclicCopyReplaceable(array[i], cycles);
  }

  return newArray;
}

function deepCyclicCopyMap<T>(
  map: Map<unknown, unknown>,
  cycles: WeakMap<any, unknown>,
): T {
  const newMap = new Map();

  cycles.set(map, newMap);

  for (const [key, value] of map.entries()) {
    newMap.set(key, deepCyclicCopyReplaceable(value, cycles));
  }

  return newMap as any;
}

function getSerializableProperties<T>(
  obj: T,
): Array<string | symbol> | undefined {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }

  const serializableProperties: unknown = (obj as Record<string | symbol, any>)[
    SERIALIZABLE_PROPERTIES
  ];

  if (!Array.isArray(serializableProperties)) {
    return;
  }

  return serializableProperties.filter(
    (key): key is string | symbol =>
      typeof key === 'string' || typeof key === 'symbol',
  );
}
