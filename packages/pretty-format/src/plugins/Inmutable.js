/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/* eslint-disable max-len */
'use strict';
const prettyI = require('pretty-immutable');
const InmutableTypes = ['List', 'OrderedSet'];
const isInMutable = val => {
  return (element, index, array) => val.toString().includes(element);
};

module.exports = {
  print(val, print, indent) {
    return 'Inmutable ' + prettyI(val);
  },
  test(val) {
    return val && InmutableTypes.some(isInMutable(val));
  },
};
