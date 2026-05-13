/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-implied-eval, unicorn/consistent-function-scoping */

type TimerCallback = TimerHandler;

type TimerEntry = {
  id: number;
  callback: TimerCallback;
  args: Array<unknown>;
  delay: number;
  scheduledTime: number;
  isInterval: boolean;
  cleared: boolean;
};

type OriginalTimers = {
  setTimeout: typeof globalThis.setTimeout;
  setInterval: typeof globalThis.setInterval;
  clearTimeout: typeof globalThis.clearTimeout;
  clearInterval: typeof globalThis.clearInterval;
  dateNow: typeof Date.now;
  date: DateConstructor;
};

const MAX_TIMER_ITERATIONS = 100_000;

function normalizeDelay(delay?: number): number {
  const numericDelay = Number(delay ?? 0);
  if (!Number.isFinite(numericDelay)) {
    return 0;
  }

  return Math.max(0, numericDelay);
}

function normalizeSystemTime(time?: number | Date): number {
  if (time instanceof Date) {
    return time.getTime();
  }

  const numericTime = Number(time ?? 0);
  if (!Number.isFinite(numericTime)) {
    return 0;
  }

  return numericTime;
}

export function createTimerSystem(): {
  useFakeTimers: () => void;
  useRealTimers: () => void;
  runAllTimers: () => void;
  runOnlyPendingTimers: () => void;
  advanceTimersByTime: (ms: number) => void;
  advanceTimersToNextTimer: () => void;
  clearAllTimers: () => void;
  getTimerCount: () => number;
  setSystemTime: (time: number | Date) => void;
  getRealSystemTime: () => number;
} {
  let originals: OriginalTimers | null = null;
  let isUsingFakeTimers = false;
  let currentFakeTime = Date.now();
  let nextTimerId = 1;

  const timers = new Map<number, TimerEntry>();

  const getSortedPendingTimers = (): Array<TimerEntry> => {
    const pending = [...timers.values()].filter(timer => !timer.cleared);
    pending.sort((left, right) => {
      if (left.scheduledTime !== right.scheduledTime) {
        return left.scheduledTime - right.scheduledTime;
      }
      return left.id - right.id;
    });
    return pending;
  };

  const getNextPendingTimer = (limit?: number): TimerEntry | undefined => {
    const sorted = getSortedPendingTimers();
    if (limit === undefined) {
      return sorted[0];
    }
    return sorted.find(timer => timer.scheduledTime <= limit);
  };

  const invokeTimerCallback = (timer: TimerEntry): void => {
    if (typeof timer.callback === 'function') {
      timer.callback(...timer.args);
      return;
    }

    // eslint-disable-next-line no-new-func
    new Function(String(timer.callback))();
  };

  const scheduleTimer = (
    callback: TimerCallback,
    delay: number | undefined,
    args: Array<unknown>,
    isInterval: boolean,
  ): number => {
    const id = nextTimerId++;
    const normalizedDelay = normalizeDelay(delay);

    timers.set(id, {
      args,
      callback,
      cleared: false,
      delay: normalizedDelay,
      id,
      isInterval,
      scheduledTime: currentFakeTime + normalizedDelay,
    });

    return id;
  };

  const clearTimer = (id: number): void => {
    const timer = timers.get(id);
    if (!timer) {
      return;
    }

    timer.cleared = true;
    timers.delete(id);
  };

  const fireTimer = (timer: TimerEntry): void => {
    if (timer.cleared || !timers.has(timer.id)) {
      return;
    }

    currentFakeTime = Math.max(currentFakeTime, timer.scheduledTime);

    if (timer.isInterval) {
      invokeTimerCallback(timer);

      if (!timer.cleared && timers.has(timer.id)) {
        timer.scheduledTime = currentFakeTime + timer.delay;
      }
      return;
    }

    timer.cleared = true;
    timers.delete(timer.id);
    invokeTimerCallback(timer);
  };

  const installFakeDate = (): void => {
    if (!originals) {
      return;
    }

    const OriginalDate = originals.date;
    const fakeDate = function (
      this: unknown,
      ...args: Array<unknown>
    ): Date | string {
      if (new.target != null) {
        if (args.length === 0) {
          return new OriginalDate(currentFakeTime);
        }

        return new (OriginalDate as unknown as new (
          ...params: Array<unknown>
        ) => Date)(...args);
      }

      if (args.length === 0) {
        return new OriginalDate(currentFakeTime).toString();
      }

      return new (OriginalDate as unknown as new (
        ...params: Array<unknown>
      ) => Date)(...args).toString();
    } as unknown as DateConstructor;

    fakeDate.now = (): number => currentFakeTime;
    fakeDate.parse = OriginalDate.parse;
    fakeDate.UTC = OriginalDate.UTC;
    (fakeDate as unknown as {prototype: object}).prototype =
      OriginalDate.prototype;

    globalThis.Date = fakeDate;
  };

  const useFakeTimers = (): void => {
    if (isUsingFakeTimers) {
      return;
    }

    originals = {
      clearInterval: globalThis.clearInterval,
      clearTimeout: globalThis.clearTimeout,
      date: globalThis.Date,
      dateNow: Date.now,
      setInterval: globalThis.setInterval,
      setTimeout: globalThis.setTimeout,
    };

    isUsingFakeTimers = true;
    currentFakeTime = originals.dateNow();
    nextTimerId = 1;
    timers.clear();

    const fakeSetTimeout = (
      callback: TimerCallback,
      delay?: number,
      ...args: Array<unknown>
    ) => {
      return scheduleTimer(callback, delay, args, false);
    };
    globalThis.setTimeout =
      fakeSetTimeout as unknown as typeof globalThis.setTimeout;

    const fakeSetInterval = (
      callback: TimerCallback,
      delay?: number,
      ...args: Array<unknown>
    ) => {
      return scheduleTimer(callback, delay, args, true);
    };
    globalThis.setInterval =
      fakeSetInterval as unknown as typeof globalThis.setInterval;

    globalThis.clearTimeout = ((id?: number) => {
      if (typeof id === 'number') {
        clearTimer(id);
      }
    }) as typeof globalThis.clearTimeout;

    globalThis.clearInterval = ((id?: number) => {
      if (typeof id === 'number') {
        clearTimer(id);
      }
    }) as typeof globalThis.clearInterval;

    installFakeDate();
  };

  const useRealTimers = (): void => {
    if (!isUsingFakeTimers || !originals) {
      return;
    }

    globalThis.setTimeout = originals.setTimeout;
    globalThis.setInterval = originals.setInterval;
    globalThis.clearTimeout = originals.clearTimeout;
    globalThis.clearInterval = originals.clearInterval;
    globalThis.Date = originals.date;

    timers.clear();
    originals = null;
    isUsingFakeTimers = false;
  };

  const runAllTimers = (): void => {
    if (!isUsingFakeTimers) {
      return;
    }

    let iterationCount = 0;
    while (getTimerCount() > 0) {
      if (iterationCount >= MAX_TIMER_ITERATIONS) {
        throw new Error('Aborting timer run: possible infinite loop');
      }

      const nextTimer = getNextPendingTimer();
      if (!nextTimer) {
        break;
      }

      fireTimer(nextTimer);
      iterationCount += 1;
    }
  };

  const runOnlyPendingTimers = (): void => {
    if (!isUsingFakeTimers) {
      return;
    }

    const snapshot = getSortedPendingTimers();
    for (const timer of snapshot) {
      fireTimer(timer);
    }
  };

  const advanceTimersByTime = (ms: number): void => {
    if (!isUsingFakeTimers) {
      return;
    }

    const targetTime = currentFakeTime + normalizeDelay(ms);
    let iterationCount = 0;

    while (true) {
      if (iterationCount >= MAX_TIMER_ITERATIONS) {
        throw new Error('Aborting timer run: possible infinite loop');
      }

      const nextTimer = getNextPendingTimer(targetTime);
      if (!nextTimer) {
        break;
      }

      fireTimer(nextTimer);
      iterationCount += 1;
    }

    currentFakeTime = targetTime;
  };

  const advanceTimersToNextTimer = (): void => {
    if (!isUsingFakeTimers) {
      return;
    }

    const nextTimer = getNextPendingTimer();
    if (!nextTimer) {
      return;
    }

    currentFakeTime = nextTimer.scheduledTime;
    fireTimer(nextTimer);
  };

  const clearAllTimers = (): void => {
    for (const timer of timers.values()) {
      timer.cleared = true;
    }
    timers.clear();
  };

  const getTimerCount = (): number => {
    let count = 0;
    for (const timer of timers.values()) {
      if (!timer.cleared) {
        count += 1;
      }
    }
    return count;
  };

  const setSystemTime = (time: number | Date): void => {
    currentFakeTime = normalizeSystemTime(time);
  };

  const getRealSystemTime = (): number => {
    if (originals) {
      return originals.dateNow();
    }
    return Date.now();
  };

  return {
    advanceTimersByTime,
    advanceTimersToNextTimer,
    clearAllTimers,
    getRealSystemTime,
    getTimerCount,
    runAllTimers,
    runOnlyPendingTimers,
    setSystemTime,
    useFakeTimers,
    useRealTimers,
  };
}
