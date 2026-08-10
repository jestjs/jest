/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('loading a file with a dynamic local require should work', () => {
  const {withStandardResolution} = require('../dynamicRequire');
  expect(withStandardResolution()).toBe(1);
});

test('loading a file with a dynamic require and custom resolve should work', () => {
  const {withCustomResolution} = require('../dynamicRequire');
  expect(withCustomResolution()).toBe(1);
});
