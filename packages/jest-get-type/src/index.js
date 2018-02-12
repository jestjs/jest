/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

export type ValueType =
  | 'array'
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

const valueTypeMap: {[key: string]: ?ValueType} = {
  array: 'array',
  boolean: 'boolean',
  date: 'date',
  function: 'function',
  map: 'map',
  null: 'null',
  number: 'number',
  object: 'object',
  regexp: 'regexp',
  set: 'set',
  string: 'string',
  symbol: 'symbol',
  undefined: 'undefined',
};

const getType = (value: any): ValueType => {
  const valueType = Object.prototype.toString
    .call(value)
    .replace(/(^\[object |\]$)/g, '')
    .toLowerCase();
  if (valueTypeMap[valueType]) {
    return valueTypeMap[valueType];
  }
  throw new Error(`value of unknown type: ${value}`);
};

module.exports = getType;
