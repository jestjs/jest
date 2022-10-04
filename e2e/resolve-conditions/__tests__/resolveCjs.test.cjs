/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {fn} = require('fake-dep');

test('returns correct message', () => {
  expect(fn()).toBe('hello from CJS');
});
