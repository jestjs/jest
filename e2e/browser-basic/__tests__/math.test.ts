/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from '@jest/globals';

describe('Math in browser', () => {
  it('adds numbers', () => {
    expect(1 + 1).toBe(2);
  });

  it('uses Math.random', () => {
    const r = Math.random();
    expect(r >= 0 && r < 1).toBe(true);
  });
});
