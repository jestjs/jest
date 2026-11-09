/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {plugins} from 'pretty-format';

const builtInObject: Array<unknown> = [
  Array,
  ArrayBuffer,
  Boolean,
  DataView,
  Date,
  Float32Array,
  Float64Array,
  Int16Array,
  Int32Array,
  Int8Array,
  Map,
  Number,
  Set,
  RegExp,
  String,
  Symbol,
  Uint16Array,
  Uint32Array,
  Uint8Array,
  Uint8ClampedArray,
  WeakMap,
  WeakSet,
  Promise,
];

if (typeof BigInt !== 'undefined') {
  builtInObject.push(BigInt);
}

if (typeof BigInt64Array !== 'undefined') {
  builtInObject.push(BigInt64Array);
}

if (typeof BigUint64Array !== 'undefined') {
  builtInObject.push(BigUint64Array);
}

if (typeof SharedArrayBuffer !== 'undefined') {
  builtInObject.push(SharedArrayBuffer);
}

if (typeof Buffer !== 'undefined') {
  builtInObject.push(Buffer);
}

if (typeof Window !== 'undefined') {
  builtInObject.push(Window);
}

try {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const Generator = (function* () {})().constructor;
  if (Generator) {
    builtInObject.push(Generator);
  }
} catch {
  // Ignored in environments where generators are unsupported
}

try {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const AsyncGenerator = (async function* () {})().constructor;
  if (AsyncGenerator) {
    builtInObject.push(AsyncGenerator);
  }
} catch {
  // Ignored in environments where async generators are unsupported
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
        Object.create(null),
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
      const descriptor = descriptors[key];

      let value;

      if (descriptor.get) {
        const getterRes = (object as Record<string | symbol, unknown>)[key];
        const isSelfReferential =
          getterRes?.constructor === (object as any).constructor &&
          getterRes?.constructor !== Object;

        value = isSelfReferential
          ? '[Getter]'
          : deepCyclicCopyReplaceable(getterRes, cycles);
      } else {
        value = deepCyclicCopyReplaceable(
          (object as Record<string | symbol, unknown>)[key],
          cycles,
        );
      }

      newDescriptors[key] = {
        configurable: true,
        enumerable,
        value,
        writable: true,
      };
      return newDescriptors;
    },
    Object.create(null),
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

  for (const [key, value] of map) {
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
