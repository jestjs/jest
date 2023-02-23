/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment ./DocblockPragmasEnvironment.js
 * @my-custom-pragma pragma-value
 */

test('docblock pragmas', () => {
  expect(myCustomPragma).toBe('pragma-value'); // eslint-disable-line no-undef
});
