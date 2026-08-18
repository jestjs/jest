/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const mainAtTopLevel = require.main;

test('require.main at the test file top level is the test file', () => {
  expect(mainAtTopLevel).not.toBeNull();
  expect(mainAtTopLevel.filename).toBe(__filename);
});
