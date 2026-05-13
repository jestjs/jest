/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createTimerSystem} from '../../client/tester/timers';

describe('createTimerSystem', () => {
  const originalSetTimeout = globalThis.setTimeout;
  const originalSetInterval = globalThis.setInterval;
  const originalClearTimeout = globalThis.clearTimeout;
  const originalClearInterval = globalThis.clearInterval;
  const originalDateNow = Date.now;

  let timerSystem: ReturnType<typeof createTimerSystem>;

  beforeEach(() => {
    timerSystem = createTimerSystem();
  });

  afterEach(() => {
    timerSystem.useRealTimers();
  });

  test('useFakeTimers replaces globals, useRealTimers restores originals', () => {
    timerSystem.useFakeTimers();

    expect(globalThis.setTimeout).not.toBe(originalSetTimeout);
    expect(globalThis.setInterval).not.toBe(originalSetInterval);
    expect(globalThis.clearTimeout).not.toBe(originalClearTimeout);
    expect(globalThis.clearInterval).not.toBe(originalClearInterval);
    expect(Date.now).not.toBe(originalDateNow);

    timerSystem.useRealTimers();

    expect(globalThis.setTimeout).toBe(originalSetTimeout);
    expect(globalThis.setInterval).toBe(originalSetInterval);
    expect(globalThis.clearTimeout).toBe(originalClearTimeout);
    expect(globalThis.clearInterval).toBe(originalClearInterval);
    expect(Date.now).toBe(originalDateNow);
  });

  test('runAllTimers fires all scheduled timers in order', () => {
    timerSystem.useFakeTimers();
    const calls: Array<string> = [];

    setTimeout(() => calls.push('10ms'), 10);
    setTimeout(() => calls.push('30ms'), 30);
    setTimeout(() => calls.push('20ms'), 20);

    timerSystem.runAllTimers();

    expect(calls).toEqual(['10ms', '20ms', '30ms']);
    expect(timerSystem.getTimerCount()).toBe(0);
  });

  test('runOnlyPendingTimers fires current pending, not newly added timers', () => {
    timerSystem.useFakeTimers();
    const calls: Array<string> = [];

    setTimeout(() => {
      calls.push('first');
      setTimeout(() => {
        calls.push('nested');
      }, 0);
    }, 0);
    setTimeout(() => {
      calls.push('second');
    }, 0);

    timerSystem.runOnlyPendingTimers();
    expect(calls).toEqual(['first', 'second']);
    expect(timerSystem.getTimerCount()).toBe(1);

    timerSystem.runOnlyPendingTimers();
    expect(calls).toEqual(['first', 'second', 'nested']);
    expect(timerSystem.getTimerCount()).toBe(0);
  });

  test('advanceTimersByTime fires timers up to elapsed time', () => {
    timerSystem.useFakeTimers();
    const calls: Array<string> = [];

    setTimeout(() => calls.push('50ms'), 50);
    setTimeout(() => calls.push('100ms'), 100);
    setTimeout(() => calls.push('150ms'), 150);

    timerSystem.advanceTimersByTime(100);

    expect(calls).toEqual(['50ms', '100ms']);
    expect(timerSystem.getTimerCount()).toBe(1);
  });

  test('advanceTimersToNextTimer fires only next scheduled timer', () => {
    timerSystem.useFakeTimers();
    const calls: Array<string> = [];

    setTimeout(() => calls.push('first'), 10);
    setTimeout(() => calls.push('second'), 20);

    timerSystem.advanceTimersToNextTimer();

    expect(calls).toEqual(['first']);
    expect(timerSystem.getTimerCount()).toBe(1);
  });

  test('clearAllTimers removes all pending timers without firing', () => {
    timerSystem.useFakeTimers();
    const onTimeout = jest.fn();
    const onInterval = jest.fn();

    setTimeout(onTimeout, 10);
    setInterval(onInterval, 10);

    expect(timerSystem.getTimerCount()).toBe(2);

    timerSystem.clearAllTimers();

    expect(timerSystem.getTimerCount()).toBe(0);
    timerSystem.runAllTimers();
    expect(onTimeout).not.toHaveBeenCalled();
    expect(onInterval).not.toHaveBeenCalled();
  });

  test('getTimerCount returns count of pending timers', () => {
    timerSystem.useFakeTimers();

    const timeoutOne = setTimeout(() => {}, 10);
    setTimeout(() => {}, 20);

    expect(timerSystem.getTimerCount()).toBe(2);

    clearTimeout(timeoutOne);

    expect(timerSystem.getTimerCount()).toBe(1);
  });

  test('setSystemTime mocks Date.now and new Date()', () => {
    timerSystem.useFakeTimers();

    const first = 1_700_000_000_000;
    timerSystem.setSystemTime(first);

    expect(Date.now()).toBe(first);
    expect(Date.now()).toBe(first);

    const second = new Date(first + 1000);
    timerSystem.setSystemTime(second);

    expect(Date.now()).toBe(first + 1000);
    expect(Date.now()).toBe(first + 1000);
  });

  test('getRealSystemTime returns real Date.now even when timers are faked', () => {
    const before = Date.now();

    timerSystem.useFakeTimers();
    timerSystem.setSystemTime(123);

    expect(Date.now()).toBe(123);

    const realNow = timerSystem.getRealSystemTime();

    expect(realNow).toBeGreaterThanOrEqual(before);
    expect(realNow).not.toBe(123);
  });

  test('runAllTimers throws when timers recursively schedule forever', () => {
    timerSystem.useFakeTimers();

    const loop = (): void => {
      setTimeout(loop, 0);
    };

    setTimeout(loop, 0);

    expect(() => timerSystem.runAllTimers()).toThrow(
      'Aborting timer run: possible infinite loop',
    );
  });
});
