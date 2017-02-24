/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */

'use strict';

const traverseImmutable = require('./traverseImmutable');
const IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';

const isStack = (maybeStack: Object) => {
  return !!(maybeStack && maybeStack[IS_STACK_SENTINEL]);
};

const printImmutableStack = (
  val: Object, 
  print: Function,
  indent: Function,
  opts: Object,
  colors: Object
) => {
  return traverseImmutable(val, print, indent, opts, colors);
};

module.exports = {
  print: printImmutableStack,
  test: (object: Object) => object && isStack(object),
};
