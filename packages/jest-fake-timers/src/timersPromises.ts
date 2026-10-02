/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as nativeTimersPromises from 'node:timers/promises';
import type {
  Clock as InstalledClock,
  NodeImmediate,
  TimerId,
} from '@sinonjs/fake-timers';

/**
 * `timers/promises` APIs that fake timers can drive. `scheduler.yield` is
 * deliberately absent: it does not schedule a timer at all, it hands control
 * back to the event loop with an internal immediate that fake timers cannot
 * intercept.
 */
export type FakeableTimersPromisesAPI =
  'setImmediate' | 'setInterval' | 'setTimeout';

export type TimersPromisesModule = typeof nativeTimersPromises;

type FakeClockLookup = (
  api: FakeableTimersPromisesAPI,
) => InstalledClock | undefined;

interface AbortableOptions {
  ref?: boolean;
  signal?: AbortSignal | undefined;
}

const nativeScheduler = nativeTimersPromises.scheduler;

// Node rejects with an `AbortError` that keeps the signal's reason as `cause`,
// rather than rejecting with the reason itself.
const abortError = (signal: AbortSignal): Error => {
  const error = new Error('The operation was aborted', {cause: signal.reason});
  error.name = 'AbortError';
  (error as NodeJS.ErrnoException).code = 'ABORT_ERR';
  return error;
};

const unrefTimer = (timer: TimerId): void => {
  (timer as unknown as {unref: () => void}).unref();
};

const createFakeTimer = <T>(
  clock: InstalledClock,
  api: 'setImmediate' | 'setTimeout',
  delay: number,
  value: T,
  options: AbortableOptions,
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const {signal} = options;

    if (signal?.aborted === true) {
      reject(abortError(signal));
      return;
    }

    const onTimer = () => {
      signal?.removeEventListener('abort', onAbort);
      resolve(value);
    };

    const onAbort = () => {
      if (api === 'setImmediate') {
        clock.clearImmediate(timer as NodeImmediate);
      } else {
        clock.clearTimeout(timer);
      }
      reject(abortError(signal!));
    };

    const timer: TimerId =
      api === 'setImmediate'
        ? clock.setImmediate(onTimer)
        : clock.setTimeout(onTimer, delay);

    signal?.addEventListener('abort', onAbort, {once: true});

    if (options.ref === false) {
      unrefTimer(timer);
    }
  });

const createFakeInterval = <T>(
  clock: InstalledClock,
  delay: number,
  value: T,
  options: AbortableOptions,
): NodeJS.AsyncIterator<T> => {
  const {signal} = options;
  const isAborted = signal?.aborted === true;
  let resolveConsumer: (() => void) | undefined;
  let rejectConsumer: ((error: Error) => void) | undefined;

  // Ticks nobody is waiting for are dropped, like the real API: the iterator
  // only ever produces the tick the current `next()` call is waiting for.
  const onTick = () => {
    if (resolveConsumer === undefined) {
      return;
    }

    const resolve = resolveConsumer;
    resolveConsumer = undefined;
    rejectConsumer = undefined;
    resolve();
  };

  const onAbort = () => {
    // The real API stops ticking as soon as the signal is aborted, whether or
    // not anyone is waiting for the next tick.
    if (timer !== undefined) {
      clock.clearInterval(timer);
    }

    if (rejectConsumer === undefined) {
      return;
    }

    const reject = rejectConsumer;
    resolveConsumer = undefined;
    rejectConsumer = undefined;
    reject(abortError(signal!));
  };

  const timer = isAborted ? undefined : clock.setInterval(onTick, delay);

  if (timer !== undefined) {
    if (options.ref === false) {
      unrefTimer(timer);
    }
    signal?.addEventListener('abort', onAbort, {once: true});
  }

  return (async function* fakeInterval() {
    try {
      for (;;) {
        if (signal?.aborted === true) {
          throw abortError(signal);
        }

        await new Promise<void>((resolve, reject) => {
          resolveConsumer = resolve;
          rejectConsumer = reject;
        });

        yield value;
      }
    } finally {
      if (timer !== undefined) {
        clock.clearInterval(timer);
      }
      signal?.removeEventListener('abort', onAbort);
    }
  })();
};

/**
 * Builds a `timers/promises` module whose functions resolve on the fake clock
 * while fake timers are installed, and call straight through to Node's own
 * implementation otherwise.
 *
 * The functions dispatch when they are *called*, not when this module is
 * built, so `import * as timersPromises from 'node:timers/promises'` at the
 * top of a test file still follows `jest.useFakeTimers()` called later on.
 */
export const createTimersPromises = (
  getFakeClock: FakeClockLookup,
): TimersPromisesModule => {
  const setTimeout = <T>(
    delay?: number,
    value?: T,
    options: AbortableOptions = {},
  ): Promise<T> => {
    const clock = getFakeClock('setTimeout');

    return clock === undefined
      ? nativeTimersPromises.setTimeout(delay, value, options)
      : createFakeTimer(clock, 'setTimeout', delay ?? 1, value as T, options);
  };

  const setImmediate = <T>(
    value?: T,
    options: AbortableOptions = {},
  ): Promise<T> => {
    const clock = getFakeClock('setImmediate');

    return clock === undefined
      ? nativeTimersPromises.setImmediate(value, options)
      : createFakeTimer(clock, 'setImmediate', 0, value as T, options);
  };

  const setInterval = <T>(
    delay?: number,
    value?: T,
    options: AbortableOptions = {},
  ): NodeJS.AsyncIterator<T> => {
    const clock = getFakeClock('setInterval');

    return clock === undefined
      ? nativeTimersPromises.setInterval(delay, value, options)
      : createFakeInterval(clock, delay ?? 1, value as T, options);
  };

  class Scheduler {
    yield(): Promise<void> {
      return nativeScheduler.yield();
    }

    wait(delay?: number, options?: AbortableOptions): Promise<void> {
      const clock = getFakeClock('setTimeout');

      return clock === undefined
        ? nativeScheduler.wait(delay ?? 1, options)
        : createFakeTimer(
            clock,
            'setTimeout',
            delay ?? 1,
            undefined,
            options ?? {},
          );
    }
  }

  return {
    scheduler: new Scheduler(),
    setImmediate,
    setInterval,
    setTimeout,
  };
};
