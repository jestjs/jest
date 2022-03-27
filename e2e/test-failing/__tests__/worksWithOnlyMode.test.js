/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('block with only, should pass', () => {
  it.only.failing('failing failes = passes, should pass', () => {
    expect(10).toBe(101);
  });

  it('failing test', () => {
    expect(10).toBe(101);
  });

  it('passing test', () => {
    expect(10).toBe(10);
  });
});

describe('block with only, should fail', () => {
  it.only.failing('failing passes = fails, should fail', () => {
    expect(10).toBe(10);
  });

  it('failing test', () => {
    expect(10).toBe(101);
  });

  it('passing test', () => {
    expect(10).toBe(10);
  });
});
