/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const toString = Object.prototype.toString;

const format = (value: string): string =>
  require('pretty-format')(value, {min: true});

const extractType = (stringedType: string) =>
  stringedType.split(' ')[1].slice(0, -1);

const prettyPrintType = (value: any) => extractType(toString.call(value));

module.exports = {
  format,
  prettyPrintType,
};
