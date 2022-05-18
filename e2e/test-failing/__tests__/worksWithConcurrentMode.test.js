/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('block with concurrent', () => {
  it('failing test', () => {
    expect(10).toBe(101);
  });

  it.concurrent.failing('failing passes = fails', () => {
    expect(10).toBe(10);
  });

  it.concurrent.failing('failing fails = passes', () => {
    expect(10).toBe(101);
  });

  it.concurrent.skip.failing('skipped failing fails', () => {
    expect(10).toBe(101);
  });
});
