/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */

'use strict';

const printImmutable = require('./printImmutable');
const IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';

const isMap = (maybeMap: Object) => {
  return !!(maybeMap && maybeMap[IS_MAP_SENTINEL]);
};

const printImmutableMap = (
  val: Object, 
  print: Function,
  indent: Function,
  opts: Object,
  colors: Object
) => {
  return printImmutable(val, print, indent, opts, colors, 'Map', true);
};

module.exports = {
  print: printImmutableMap,
  test: (object: Object) => object && isMap(object),
};
