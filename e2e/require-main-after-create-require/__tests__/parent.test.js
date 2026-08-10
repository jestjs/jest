/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const Module = require('module');
const path = require('path');

test('require child from parent', () => {
  // createRequire with a different file
  const newRequire = Module.createRequire(path.resolve('./empty.js'));
  expect(() => newRequire('./child')).not.toThrow();
});
