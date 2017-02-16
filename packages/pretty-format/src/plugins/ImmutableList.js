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
const IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';

const isList = (maybeList: Object) => {
  return !!(maybeList && maybeList[IS_LIST_SENTINEL]);
}

const printImmutableOrderedSet = (val: Object) => {  
  return IMMUTABLE_NAMESPACE + val.toString();
};

module.exports = {
  print: printImmutableOrderedSet,
  test: (object: Object) => object && isList(object),
};
