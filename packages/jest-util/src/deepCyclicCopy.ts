/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const EMPTY = new Set<string>();

export type DeepCyclicCopyOptions = {
  blacklist?: Set<string>;
  keepPrototype?: boolean;
};

export default function deepCyclicCopy<T>(
  value: T,
  options: DeepCyclicCopyOptions = {blacklist: EMPTY, keepPrototype: false},
  cycles: WeakMap<any, any> = new WeakMap(),
): T {
  if (typeof value !== 'object' || value === null || Buffer.isBuffer(value)) {
    return value;
  } else if (cycles.has(value)) {
    return cycles.get(value);
  } else if (Array.isArray(value)) {
    return deepCyclicCopyArray(value, options, cycles);
  } else {
    return deepCyclicCopyObject(value, options, cycles);
  }
}

function deepCyclicCopyObject<T>(
  object: T,
  options: DeepCyclicCopyOptions,
  cycles: WeakMap<any, any>,
): T {
  const newObject = options.keepPrototype
    ? Object.create(Object.getPrototypeOf(object))
    : {};

  const descriptors = Object.getOwnPropertyDescriptors(object);

  cycles.set(object, newObject);

  Object.keys(descriptors).forEach(key => {
    if (options.blacklist && options.blacklist.has(key)) {
      delete descriptors[key];
      return;
    }

    const descriptor = descriptors[key];
    if (typeof descriptor.value !== 'undefined') {
      descriptor.value = deepCyclicCopy(
        descriptor.value,
        {blacklist: EMPTY, keepPrototype: options.keepPrototype},
        cycles,
      );
    }

    descriptor.configurable = true;
  });

  return Object.defineProperties(newObject, descriptors);
}

function deepCyclicCopyArray<T>(
  array: Array<T>,
  options: DeepCyclicCopyOptions,
  cycles: WeakMap<any, any>,
): T {
  const newArray = options.keepPrototype
    ? new (Object.getPrototypeOf(array).constructor)(array.length)
    : [];
  const length = array.length;

  cycles.set(array, newArray);

  for (let i = 0; i < length; i++) {
    newArray[i] = deepCyclicCopy(
      array[i],
      {blacklist: EMPTY, keepPrototype: options.keepPrototype},
      cycles,
    );
  }

  return newArray;
}
