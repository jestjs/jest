/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment ./CircusAsyncHandleTestEventEnvironment.js
 */

describe('suite', () => {
  beforeEach(() => {});
  afterEach(() => {
    throw new Error();
  });

  test('passing test', () => {
    expect(true).toBe(true);
  });

  test('failing test', () => {
    expect(true).toBe(false);
  });
});
