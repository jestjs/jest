/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const EMPTY = new Set();

// Node 6 does not have gOPDs, so we define a simple polyfill for it.
if (!Object.getOwnPropertyDescriptors) {
  // $FlowFixMe: polyfill
  Object.getOwnPropertyDescriptors = obj => {
    const list = {};

    Object.getOwnPropertyNames(obj)
      .concat(Object.getOwnPropertySymbols(obj))
      // $FlowFixMe: assignment with a Symbol is OK.
      .forEach(key => (list[key] = Object.getOwnPropertyDescriptor(obj, key)));

    return list;
  };
}

export default function deepCyclicCopy(
  value: any,
  blacklist: Set<string> = EMPTY,
  cycles: WeakMap<any, any> = new WeakMap(),
): any {
  if (typeof value !== 'object' || value === null) {
    return value;
  } else if (cycles.has(value)) {
    return cycles.get(value);
  } else if (Array.isArray(value)) {
    return deepCyclicCopyArray(value, blacklist, cycles);
  } else {
    return deepCyclicCopyObject(value, blacklist, cycles);
  }
}

function deepCyclicCopyObject(
  object: Object,
  blacklist: Set<string>,
  cycles: WeakMap<any, any>,
): Object {
  const newObject = Object.create(Object.getPrototypeOf(object));
  // $FlowFixMe: Object.getOwnPropertyDescriptors is polyfilled above.
  const descriptors = Object.getOwnPropertyDescriptors(object);

  cycles.set(object, newObject);

  Object.keys(descriptors).forEach(key => {
    if (blacklist.has(key)) {
      delete descriptors[key];
      return;
    }

    const descriptor = descriptors[key];

    if (typeof descriptor.value !== 'undefined') {
      descriptor.value = deepCyclicCopy(descriptor.value, EMPTY, cycles);
    }

    descriptor.configurable = true;
  });

  return Object.defineProperties(newObject, descriptors);
}

function deepCyclicCopyArray(
  array: Array<any>,
  blacklist: Set<string>,
  cycles: WeakMap<any, any>,
): Array<any> {
  const newArray = [];
  const length = array.length;

  cycles.set(array, newArray);

  for (let i = 0; i < length; i++) {
    newArray[i] = deepCyclicCopy(array[i], EMPTY, cycles);
  }

  return newArray;
}
