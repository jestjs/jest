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
const IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';

const isList = (maybeList: Object) => {
  return !!(maybeList && maybeList[IS_LIST_SENTINEL]);
};

const test = (object: Object) => object && isList(object);

const print = (
  val: Object, 
  print: Function,
  indent: Function,
  opts: Object,
  colors: Object
) => {
  return printImmutable(val, print, indent, opts, colors, 'List', false);
};

module.exports = {print, test};
