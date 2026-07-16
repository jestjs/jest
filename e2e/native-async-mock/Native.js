/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

function awaitable() {
  return Promise.resolve();
}

module.exports.syncMethod = () => 42;

module.exports.asyncMethod = async () => {
  await awaitable();
  return 42;
};
