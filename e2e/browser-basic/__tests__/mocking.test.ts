/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it, jest} from '@jest/globals';

describe('mocking', () => {
  it('creates mock functions', () => {
    const fn = jest.fn();
    fn('a', 'b');
    fn('c');

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });

  it('mock return values', () => {
    const fn = jest.fn();
    fn.mockReturnValue(42);

    expect(fn()).toBe(42);
    expect(fn()).toBe(42);
  });

  it('mock implementation', () => {
    const fn = jest.fn();
    fn.mockImplementation(
      ((x: number) => x * 2) as unknown as (...args: Array<unknown>) => unknown,
    );

    expect(fn(3)).toBe(6);
    expect(fn(5)).toBe(10);
  });

  it('mockReset clears calls and implementation', () => {
    const fn = jest.fn();
    fn.mockReturnValue(99);
    fn();
    fn();

    fn.mockReset();

    expect(fn).toHaveBeenCalledTimes(0);
    expect(fn()).toBeUndefined();
  });

  it('tracks call arguments', () => {
    const fn = jest.fn();
    fn(1, 2, 3);
    fn('hello');

    expect(fn.mock.calls).toHaveLength(2);
    expect(fn.mock.calls[0]).toEqual([1, 2, 3]);
    expect(fn.mock.calls[1]).toEqual(['hello']);
  });
});
