/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const EMPTY = new Set<string>();

const isDate = (value: any): value is Date => value.constructor === Date;
const isMap = (value: any): value is Map<any, any> => value.constructor === Map;
const isSet = (value: any): value is Set<any> => value.constructor === Set;
const isRegExp = (value: any): value is RegExp => value.constructor === RegExp;

export type DeepCyclicCopyOptions = {
  blacklist?: Set<string>;
  keepPrototype?: boolean;
};

export default function deepCyclicCopy<T>(
  value: T,
  options: DeepCyclicCopyOptions = {blacklist: EMPTY, keepPrototype: false},
  cycles: WeakMap<any, any> = new WeakMap(),
): T {
  if (typeof value !== 'object' || value === null) {
    return value;
  } else if (cycles.has(value)) {
    return cycles.get(value);
  } else if (Array.isArray(value)) {
    return deepCyclicCopyArray(value, options, cycles);
  } else if (isMap(value)) {
    return deepCyclicCopyMap(value, options, cycles);
  } else if (isSet(value)) {
    return deepCyclicCopySet(value, options, cycles);
  } else if (Buffer.isBuffer(value)) {
    return Buffer.from(value) as any;
  } else if (isDate(value)) {
    return new Date(value.getTime()) as any;
  } else if (isNumberArray(value)) {
    return new (Object.getPrototypeOf(value).constructor)(value);
  } else if (isRegExp(value)) {
    return deepCyclicCopyRegExp(value);
  }
  return deepCyclicCopyObject(value, options, cycles);
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

function deepCyclicCopyMap<T>(
  map: Map<any, any>,
  options: DeepCyclicCopyOptions,
  cycles: WeakMap<any, any>,
): T {
  const newMap = new Map();

  cycles.set(map, newMap);

  map.forEach((value, key) => {
    if (options.blacklist && options.blacklist.has(key)) return;
    newMap.set(
      key,
      deepCyclicCopy(
        value,
        {blacklist: EMPTY, keepPrototype: options.keepPrototype},
        cycles,
      ),
    );
  });

  return newMap as any;
}

function deepCyclicCopySet<T>(
  set: Set<T>,
  options: DeepCyclicCopyOptions,
  cycles: WeakMap<any, any>,
): T {
  const newSet = new Set();

  cycles.set(set, newSet);

  set.forEach(value => {
    newSet.add(
      deepCyclicCopy(
        value,
        {blacklist: EMPTY, keepPrototype: options.keepPrototype},
        cycles,
      ),
    );
  });

  return newSet as any;
}

function deepCyclicCopyRegExp<T>(regExp: RegExp): T {
  const newRegExp = new RegExp(regExp.source, regExp.flags);
  newRegExp.lastIndex = regExp.lastIndex;
  return newRegExp as any;
}

function isNumberArray(value: any): boolean {
  return [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
  ].includes(value.constructor);
}
