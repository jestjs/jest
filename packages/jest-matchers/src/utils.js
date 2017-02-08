/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

type GetPath = {
  hasEndProp?: bool,
  lastTraversedObject: ?Object,
  traversedPath: Array<string>,
  value?: any,
};

const getPath = (
  object: Object,
  propertyPath: string | Array<string>,
): GetPath => {
  if (!Array.isArray(propertyPath)) {
    propertyPath = propertyPath.split('.');
  }

  const lastProp = propertyPath.length === 1;

  if (propertyPath.length) {
    const prop = propertyPath[0];
    const newObject = object[prop];
    if (!lastProp && (newObject === null || newObject === undefined)) {
      // This is not the last prop in the chain. If we keep recursing it will
      // hit a `can't access property X of undefined | null`. At this point we
      // know that the chain broken and we return right away.
      return {
        hasEndProp: false,
        lastTraversedObject: object,
        traversedPath: [],
      };
    } else {
      const result = getPath(newObject, propertyPath.slice(1));
      result.lastTraversedObject || (result.lastTraversedObject = object);
      result.traversedPath.unshift(prop);
      if (propertyPath.length === 1) {
        result.hasEndProp = object.hasOwnProperty(prop);
        if (!result.hasEndProp) {
          delete result.value;
          result.traversedPath.shift();
        }
      }
      return result;
    }
  } else {
    return {
      lastTraversedObject: null,
      traversedPath: [],
      value: object,
    };
  }
};

// Strip properties from object that are not present in the subset. Useful for
// printing the diff for toMatchObject() without adding unrelated noise.
const getObjectSubset = (object: Object, subset: Object) => {
  if (Array.isArray(object)) {
    if (Array.isArray(subset) && subset.length === object.length) {
      return subset.map((sub, i) => getObjectSubset(object[i], sub));
    }
  } else if (object instanceof Date) {
    return object;
  } else if (
    typeof object === 'object' && object !== null &&
    typeof subset === 'object' && subset !== null
  ) {
    const trimmed = {};
    Object.keys(subset)
      .filter(key => object.hasOwnProperty(key))
      .forEach(key => trimmed[key] = getObjectSubset(object[key], subset[key]));

    if (Object.keys(trimmed).length > 0) {
      return trimmed;
    }
  }
  return object;
};


module.exports = {
  getObjectSubset,
  getPath,
};
