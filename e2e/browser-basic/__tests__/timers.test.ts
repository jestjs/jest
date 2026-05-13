/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {afterEach, describe, expect, it, jest} from '@jest/globals';

afterEach(() => {
  jest.useRealTimers();
});

describe('fake timers in browser', () => {
  it('only runs a setTimeout callback once', () => {
    jest.useFakeTimers();

    const fn = jest.fn();
    setTimeout(fn, 100);
    expect(fn).toHaveBeenCalledTimes(0);

    jest.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);

    jest.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('advances timers by time', () => {
    jest.useFakeTimers();

    const fn = jest.fn();
    setTimeout(fn, 1000);

    jest.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('handles setInterval', () => {
    jest.useFakeTimers();

    const fn = jest.fn();
    setInterval(fn, 100);

    jest.advanceTimersByTime(350);
    expect(fn).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });
});
