/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const mock = {};
module.exports.mock = mock;

module.exports.expectModuleMocked = module => {
  // eslint-disable-next-line no-undef
  expect(module).toBe(mock);
};
