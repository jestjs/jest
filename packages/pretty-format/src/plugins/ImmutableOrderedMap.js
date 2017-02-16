/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */

'use strict';

const IMMUTABLE_NAMESPACE = 'Immutable.';
const IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';
const IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

const isMap = (maybeMap: Object) => {
  return !!(maybeMap && maybeMap[IS_MAP_SENTINEL]);
};

const isOrdered = (maybeOrdered: Object) => {
  return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL]);
};

const isOrderedMap = (maybeOrderedMap: Object) => {
  return isMap(maybeOrderedMap) && isOrdered(maybeOrderedMap);
};

const printImmutableOrderedMap = (val: Object) => {
  return IMMUTABLE_NAMESPACE + val.toString();
};

module.exports = {
  print: printImmutableOrderedMap,
  test: (object: Object) => object && isOrderedMap(object),
};
