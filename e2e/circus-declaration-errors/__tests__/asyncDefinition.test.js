/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('describe', () => {
  test('correct test def', () => {});

  Promise.resolve().then(() => {
    test('async definition inside describe', () => {});
    afterAll(() => {});
  });
});

Promise.resolve().then(() => {
  test('async definition outside describe', () => {});
  afterAll(() => {});
});
