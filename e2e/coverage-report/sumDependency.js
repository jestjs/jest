/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

require('path');

// eslint-disable-next-line prefer-template
const uncoveredFunction = () => (true ? 1 + '5' : '999');

module.exports = {
  uncoveredFunction,
};
