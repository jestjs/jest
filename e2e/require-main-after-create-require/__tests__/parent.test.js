/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const Module = require('module');
const path = require('path');

test('require child from parent', () => {
  // createRequire with a different file
  require = Module.createRequire(path.resolve('./empty.js'));
  require('./child');

  expect(1).toBe(1);
});
