/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export default function deepCyclicCopy(
  object: any,
  cycles: WeakMap<any, any> = new WeakMap(),
) {
  if (typeof object !== 'object' || object === null) {
    return object;
  }

  let newObject;

  if (Array.isArray(object)) {
    newObject = [];
  } else {
    newObject = Object.create(Object.getPrototypeOf(object));
  }

  cycles.set(object, newObject);

  // Copying helper function. Checks into the weak map passed to manage cycles.
  const copy = (key: string | Symbol) => {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    const value = descriptor.value;

    if (descriptor.hasOwnProperty('value')) {
      if (cycles.has(value)) {
        descriptor.value = cycles.get(value);
      } else {
        descriptor.value = deepCyclicCopy(value, cycles);
      }

      // Allow tests to override whatever they need.
      descriptor.writable = true;
    }

    // Allow tests to override whatever they need.
    descriptor.configurable = true;

    try {
      Object.defineProperty(newObject, key, descriptor);
    } catch (err) {
      // Do nothing; this usually fails because a non-configurable property is
      // tried to be overridden with a configurable one (e.g. "length").
    }
  };

  // Copy string and symbol keys!
  Object.getOwnPropertyNames(object).forEach(copy);
  Object.getOwnPropertySymbols(object).forEach(copy);

  return newObject;
}
