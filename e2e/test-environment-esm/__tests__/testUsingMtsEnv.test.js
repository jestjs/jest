/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment <rootDir>/env-1.mts
 */
'use strict';

test('should pass', () => {
  expect(globalThis.someVar).toBe(42);
});
