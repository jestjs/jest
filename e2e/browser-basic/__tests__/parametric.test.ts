/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from '@jest/globals';

describe('it.each', () => {
  it.each([
    [1, 2, 3],
    [2, 3, 5],
    [10, 20, 30],
  ])('adds %d + %d = %d', (a: number, b: number, expected: number) => {
    expect(a + b).toBe(expected);
  });

  it.each(['hello', 'world'])('string %s has length > 0', (str: string) => {
    expect(str.length).toBeGreaterThan(0);
  });
});

describe.each([['chromium'], ['firefox']])('browser %s', (name: string) => {
  it('has a name', () => {
    expect(name).toBeDefined();
    expect(typeof name).toBe('string');
  });

  it('name is not empty', () => {
    expect(name.length).toBeGreaterThan(0);
  });
});
