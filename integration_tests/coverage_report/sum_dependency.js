/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

require('path');

const uncoveredFunction = () => {
  return true ? 1 + '5' : '999';
};

module.exports = {
  uncoveredFunction,
};
