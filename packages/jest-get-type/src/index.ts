/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type ValueType =
  | 'array'
  | 'bigint'
  | 'boolean'
  | 'function'
  | 'null'
  | 'number'
  | 'object'
  | 'regexp'
  | 'map'
  | 'set'
  | 'date'
  | 'string'
  | 'symbol'
  | 'undefined';

const PRIMITIVES = new Set<ValueType>([
  'string',
  'number',
  'bigint',
  'boolean',
  'null',
  'undefined',
  'symbol',
]);

// get the type of a value with handling the edge cases like `typeof []`
// and `typeof null`
function getType(value: unknown): ValueType {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'undefined':
    case 'boolean':
    case 'function':
    case 'number':
    case 'string':
    case 'symbol':
    case 'bigint': {
      return typeof value;
    }
    case 'object': {
      const objectType = Object.prototype.toString
        .call(value)
        .slice(8, -1)
        .toLowerCase();

      switch (objectType) {
        case 'array':
        case 'object':
        case 'set':
        case 'regexp':
        case 'map':
        case 'date': {
          return objectType;
        }
      }
    }
  }

  throw new Error(`value of unknown type: ${value}`);
}

getType.isPrimitive = (value: unknown) => PRIMITIVES.has(getType(value));

export = getType;
