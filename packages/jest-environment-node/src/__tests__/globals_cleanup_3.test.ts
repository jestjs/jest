/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('Globals Cleanup 3', () => {
  test('assign Object prototype descriptors to a new empty object', () => {
    const descriptors = Object.getOwnPropertyDescriptors(
      Object.getPrototypeOf({}),
    );
    Object.assign({}, descriptors);
  });
});
