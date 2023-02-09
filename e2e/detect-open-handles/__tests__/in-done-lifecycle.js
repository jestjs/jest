/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

beforeAll(done => {
  setTimeout(() => {}, 10000);
  done();
});

test('something', () => {
  expect(true).toBe(true);
});
