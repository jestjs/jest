/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

require('./sum_dependency.js');
require('./other-file');

const uncoveredFunction = () => {
  return 1 + 'abc';
};

const sum = (a, b) => {
  return a + b;
};

module.exports = {
  sum,
  uncoveredFunction,
};
