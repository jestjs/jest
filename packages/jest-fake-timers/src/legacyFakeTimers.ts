/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable local/prefer-spread-eventually */

import {promisify} from 'util';
import {StackTraceConfig, formatStackTrace} from 'jest-message-util';
import type {
  FunctionLike,
  Mock,
  ModuleMocker,
  UnknownFunction,
} from 'jest-mock';
import {setGlobal} from 'jest-util';

type Callback = (...args: Array<unknown>) => void;

type TimerID = string;

type Tick = {
  uuid: string;
  callback: Callback;
};

type Timer = {
  type: string;
  callback: Callback;
  expiry: number;
  interval?: number;
};

type TimerAPI = {
  cancelAnimationFrame: typeof globalThis.cancelAnimationFrame;
  clearImmediate: typeof globalThis.clearImmediate;
  clearInterval: typeof globalThis.clearInterval;
  clearTimeout: typeof globalThis.clearTimeout;
  nextTick: typeof process.nextTick;
  requestAnimationFrame: typeof globalThis.requestAnimationFrame;
  setImmediate: typeof globalThis.setImmediate;
  setInterval: typeof globalThis.setInterval;
  setTimeout: typeof globalThis.setTimeout;
};

type FakeTimerAPI = {
  cancelAnimationFrame: Mock<FakeTimers['_fakeClearTimer']>;
  clearImmediate: Mock<FakeTimers['_fakeClearImmediate']>;
  clearInterval: Mock<FakeTimers['_fakeClearTimer']>;
  clearTimeout: Mock<FakeTimers['_fakeClearTimer']>;
  nextTick: Mock<FakeTimers['_fakeNextTick']>;
  requestAnimationFrame: Mock<FakeTimers['_fakeRequestAnimationFrame']>;
  setImmediate: Mock<FakeTimers['_fakeSetImmediate']>;
  setInterval: Mock<FakeTimers['_fakeSetInterval']>;
  setTimeout: Mock<FakeTimers['_fakeSetTimeout']>;
};

type TimerConfig<Ref> = {
  idToRef: (id: number) => Ref;
  refToId: (ref: Ref) => number | void;
};

const MS_IN_A_YEAR = 31536000000;

export default class FakeTimers<TimerRef = unknown> {
  private _cancelledTicks!: Record<string, boolean>;
  private readonly _config: StackTraceConfig;
  private _disposed: boolean;
  private _fakeTimerAPIs!: FakeTimerAPI;
  private _fakingTime = false;
  private readonly _global: typeof globalThis;
  private _immediates!: Array<Tick>;
  private readonly _maxLoops: number;
  private readonly _moduleMocker: ModuleMocker;
  private _now!: number;
  private _ticks!: Array<Tick>;
  private readonly _timerAPIs: TimerAPI;
  private _timers!: Map<string, Timer>;
  private _uuidCounter: number;
  private readonly _timerConfig: TimerConfig<TimerRef>;

  constructor({
    global,
    moduleMocker,
    timerConfig,
    config,
    maxLoops,
  }: {
    global: typeof globalThis;
    moduleMocker: ModuleMocker;
    timerConfig: TimerConfig<TimerRef>;
    config: StackTraceConfig;
    maxLoops?: number;
  }) {
    this._global = global;
    this._timerConfig = timerConfig;
    this._config = config;
    this._maxLoops = maxLoops || 100000;
    this._uuidCounter = 1;
    this._moduleMocker = moduleMocker;

    // Store original timer APIs for future reference
    this._timerAPIs = {
      cancelAnimationFrame: global.cancelAnimationFrame,
      clearImmediate: global.clearImmediate,
      clearInterval: global.clearInterval,
      clearTimeout: global.clearTimeout,
      nextTick: global.process && global.process.nextTick,
      requestAnimationFrame: global.requestAnimationFrame,
      setImmediate: global.setImmediate,
      setInterval: global.setInterval,
      setTimeout: global.setTimeout,
    };

    this._disposed = false;

    this.reset();
  }

  clearAllTimers(): void {
    this._immediates = [];
    this._timers.clear();
  }

  dispose(): void {
    this._disposed = true;
    this.clearAllTimers();
  }

  reset(): void {
    this._cancelledTicks = {};
    this._now = 0;
    this._ticks = [];
    this._immediates = [];
    this._timers = new Map();
  }

  now(): number {
    if (this._fakingTime) {
      return this._now;
    }
    return Date.now();
  }

  runAllTicks(): void {
    this._checkFakeTimers();
    // Only run a generous number of ticks and then bail.
    // This is just to help avoid recursive loops
    let i;
    for (i = 0; i < this._maxLoops; i++) {
      const tick = this._ticks.shift();

      if (tick === undefined) {
        break;
      }

      if (
        !Object.prototype.hasOwnProperty.call(this._cancelledTicks, tick.uuid)
      ) {
        // Callback may throw, so update the map prior calling.
        this._cancelledTicks[tick.uuid] = true;
        tick.callback();
      }
    }

    if (i === this._maxLoops) {
      throw new Error(
        `Ran ${this._maxLoops} ticks, and there are still more! ` +
          "Assuming we've hit an infinite recursion and bailing out...",
      );
    }
  }

  runAllImmediates(): void {
    this._checkFakeTimers();
    // Only run a generous number of immediates and then bail.
    let i;
    for (i = 0; i < this._maxLoops; i++) {
      const immediate = this._immediates.shift();
      if (immediate === undefined) {
        break;
      }
      this._runImmediate(immediate);
    }

    if (i === this._maxLoops) {
      throw new Error(
        `Ran ${this._maxLoops} immediates, and there are still more! Assuming ` +
          "we've hit an infinite recursion and bailing out...",
      );
    }
  }

  private _runImmediate(immediate: Tick) {
    try {
      immediate.callback();
    } finally {
      this._fakeClearImmediate(immediate.uuid);
    }
  }

  runAllTimers(): void {
    this._checkFakeTimers();
    this.runAllTicks();
    this.runAllImmediates();

    // Only run a generous number of timers and then bail.
    // This is just to help avoid recursive loops
    let i;
    for (i = 0; i < this._maxLoops; i++) {
      const nextTimerHandleAndExpiry = this._getNextTimerHandleAndExpiry();

      // If there are no more timer handles, stop!
      if (nextTimerHandleAndExpiry === null) {
        break;
      }

      const [nextTimerHandle, expiry] = nextTimerHandleAndExpiry;
      this._now = expiry;
      this._runTimerHandle(nextTimerHandle);

      // Some of the immediate calls could be enqueued
      // during the previous handling of the timers, we should
      // run them as well.
      if (this._immediates.length) {
        this.runAllImmediates();
      }

      if (this._ticks.length) {
        this.runAllTicks();
      }
    }

    if (i === this._maxLoops) {
      throw new Error(
        `Ran ${this._maxLoops} timers, and there are still more! ` +
          "Assuming we've hit an infinite recursion and bailing out...",
      );
    }
  }

  runOnlyPendingTimers(): void {
    // We need to hold the current shape of `this._timers` because existing
    // timers can add new ones to the map and hence would run more than necessary.
    // See https://github.com/jestjs/jest/pull/4608 for details
    const timerEntries = Array.from(this._timers.entries());
    this._checkFakeTimers();
    this._immediates.forEach(this._runImmediate, this);

    timerEntries
      .sort(([, left], [, right]) => left.expiry - right.expiry)
      .forEach(([timerHandle, timer]) => {
        this._now = timer.expiry;
        this._runTimerHandle(timerHandle);
      });
  }

  advanceTimersToNextTimer(steps = 1): void {
    if (steps < 1) {
      return;
    }
    const nextExpiry = Array.from(this._timers.values()).reduce(
      (minExpiry: number | null, timer: Timer): number => {
        if (minExpiry === null || timer.expiry < minExpiry) return timer.expiry;
        return minExpiry;
      },
      null,
    );
    if (nextExpiry !== null) {
      this.advanceTimersByTime(nextExpiry - this._now);
      this.advanceTimersToNextTimer(steps - 1);
    }
  }

  advanceTimersByTime(msToRun: number): void {
    this._checkFakeTimers();
    // Only run a generous number of timers and then bail.
    // This is just to help avoid recursive loops
    let i;
    for (i = 0; i < this._maxLoops; i++) {
      const timerHandleAndExpiry = this._getNextTimerHandleAndExpiry();

      // If there are no more timer handles, stop!
      if (timerHandleAndExpiry === null) {
        break;
      }
      const [timerHandle, nextTimerExpiry] = timerHandleAndExpiry;

      if (this._now + msToRun < nextTimerExpiry) {
        // There are no timers between now and the target we're running to
        break;
      } else {
        msToRun -= nextTimerExpiry - this._now;
        this._now = nextTimerExpiry;
        this._runTimerHandle(timerHandle);
      }
    }

    // Advance the clock by whatever time we still have left to run
    this._now += msToRun;

    if (i === this._maxLoops) {
      throw new Error(
        `Ran ${this._maxLoops} timers, and there are still more! ` +
          "Assuming we've hit an infinite recursion and bailing out...",
      );
    }
  }

  runWithRealTimers(cb: Callback): void {
    const prevClearImmediate = this._global.clearImmediate;
    const prevClearInterval = this._global.clearInterval;
    const prevClearTimeout = this._global.clearTimeout;
    const prevNextTick = this._global.process.nextTick;
    const prevSetImmediate = this._global.setImmediate;
    const prevSetInterval = this._global.setInterval;
    const prevSetTimeout = this._global.setTimeout;

    this.useRealTimers();

    let cbErr = null;
    let errThrown = false;
    try {
      cb();
    } catch (e) {
      errThrown = true;
      cbErr = e;
    }

    this._global.clearImmediate = prevClearImmediate;
    this._global.clearInterval = prevClearInterval;
    this._global.clearTimeout = prevClearTimeout;
    this._global.process.nextTick = prevNextTick;
    this._global.setImmediate = prevSetImmediate;
    this._global.setInterval = prevSetInterval;
    this._global.setTimeout = prevSetTimeout;

    if (errThrown) {
      throw cbErr;
    }
  }

  useRealTimers(): void {
    const global = this._global;

    if (typeof global.cancelAnimationFrame === 'function') {
      setGlobal(
        global,
        'cancelAnimationFrame',
        this._timerAPIs.cancelAnimationFrame,
      );
    }
    if (typeof global.clearImmediate === 'function') {
      setGlobal(global, 'clearImmediate', this._timerAPIs.clearImmediate);
    }
    setGlobal(global, 'clearInterval', this._timerAPIs.clearInterval);
    setGlobal(global, 'clearTimeout', this._timerAPIs.clearTimeout);
    if (typeof global.requestAnimationFrame === 'function') {
      setGlobal(
        global,
        'requestAnimationFrame',
        this._timerAPIs.requestAnimationFrame,
      );
    }
    if (typeof global.setImmediate === 'function') {
      setGlobal(global, 'setImmediate', this._timerAPIs.setImmediate);
    }
    setGlobal(global, 'setInterval', this._timerAPIs.setInterval);
    setGlobal(global, 'setTimeout', this._timerAPIs.setTimeout);

    global.process.nextTick = this._timerAPIs.nextTick;

    this._fakingTime = false;
  }

  useFakeTimers(): void {
    this._createMocks();

    const global = this._global;
    if (typeof global.cancelAnimationFrame === 'function') {
      setGlobal(
        global,
        'cancelAnimationFrame',
        this._fakeTimerAPIs.cancelAnimationFrame,
      );
    }
    if (typeof global.clearImmediate === 'function') {
      setGlobal(global, 'clearImmediate', this._fakeTimerAPIs.clearImmediate);
    }
    setGlobal(global, 'clearInterval', this._fakeTimerAPIs.clearInterval);
    setGlobal(global, 'clearTimeout', this._fakeTimerAPIs.clearTimeout);
    if (typeof global.requestAnimationFrame === 'function') {
      setGlobal(
        global,
        'requestAnimationFrame',
        this._fakeTimerAPIs.requestAnimationFrame,
      );
    }
    if (typeof global.setImmediate === 'function') {
      setGlobal(global, 'setImmediate', this._fakeTimerAPIs.setImmediate);
    }
    setGlobal(global, 'setInterval', this._fakeTimerAPIs.setInterval);
    setGlobal(global, 'setTimeout', this._fakeTimerAPIs.setTimeout);

    global.process.nextTick = this._fakeTimerAPIs.nextTick;

    this._fakingTime = true;
  }

  getTimerCount(): number {
    this._checkFakeTimers();

    return this._timers.size + this._immediates.length + this._ticks.length;
  }

  private _checkFakeTimers() {
    if (!this._fakingTime) {
      this._global.console.warn(
        'A function to advance timers was called but the timers APIs are not mocked ' +
          'with fake timers. Call `jest.useFakeTimers({legacyFakeTimers: true})` ' +
          'in this test file or enable fake timers for all tests by setting ' +
          "{'enableGlobally': true, 'legacyFakeTimers': true} in " +
          `Jest configuration file.\nStack Trace:\n${formatStackTrace(
            new Error().stack!,
            this._config,
            {noStackTrace: false},
          )}`,
      );
    }
  }

  private _createMocks() {
    const fn = <T extends FunctionLike = UnknownFunction>(implementation?: T) =>
      this._moduleMocker.fn(implementation);

    const promisifiableFakeSetTimeout = fn(this._fakeSetTimeout.bind(this));
    // @ts-expect-error: no index
    promisifiableFakeSetTimeout[promisify.custom] = (
      delay?: number,
      arg?: unknown,
    ) =>
      new Promise(resolve => promisifiableFakeSetTimeout(resolve, delay, arg));

    this._fakeTimerAPIs = {
      cancelAnimationFrame: fn(this._fakeClearTimer.bind(this)),
      clearImmediate: fn(this._fakeClearImmediate.bind(this)),
      clearInterval: fn(this._fakeClearTimer.bind(this)),
      clearTimeout: fn(this._fakeClearTimer.bind(this)),
      nextTick: fn(this._fakeNextTick.bind(this)),
      requestAnimationFrame: fn(this._fakeRequestAnimationFrame.bind(this)),
      setImmediate: fn(this._fakeSetImmediate.bind(this)),
      setInterval: fn(this._fakeSetInterval.bind(this)),
      setTimeout: promisifiableFakeSetTimeout,
    };
  }

  private _fakeClearTimer(timerRef: TimerRef) {
    const uuid = this._timerConfig.refToId(timerRef);

    if (uuid) {
      this._timers.delete(String(uuid));
    }
  }

  private _fakeClearImmediate(uuid: TimerID) {
    this._immediates = this._immediates.filter(
      immediate => immediate.uuid !== uuid,
    );
  }

  private _fakeNextTick(callback: Callback, ...args: Array<unknown>) {
    if (this._disposed) {
      return;
    }

    const uuid = String(this._uuidCounter++);

    this._ticks.push({
      callback: () => callback.apply(null, args),
      uuid,
    });

    const cancelledTicks = this._cancelledTicks;
    this._timerAPIs.nextTick(() => {
      if (!Object.prototype.hasOwnProperty.call(cancelledTicks, uuid)) {
        // Callback may throw, so update the map prior calling.
        cancelledTicks[uuid] = true;
        callback.apply(null, args);
      }
    });
  }

  private _fakeRequestAnimationFrame(callback: Callback) {
    return this._fakeSetTimeout(() => {
      // TODO: Use performance.now() once it's mocked
      callback(this._now);
    }, 1000 / 60);
  }

  private _fakeSetImmediate(callback: Callback, ...args: Array<unknown>) {
    if (this._disposed) {
      return null;
    }

    const uuid = String(this._uuidCounter++);

    this._immediates.push({
      callback: () => callback.apply(null, args),
      uuid,
    });

    this._timerAPIs.setImmediate(() => {
      if (!this._disposed) {
        if (this._immediates.find(x => x.uuid === uuid)) {
          try {
            callback.apply(null, args);
          } finally {
            this._fakeClearImmediate(uuid);
          }
        }
      }
    });

    return uuid;
  }

  private _fakeSetInterval(
    callback: Callback,
    intervalDelay?: number,
    ...args: Array<unknown>
  ) {
    if (this._disposed) {
      return null;
    }

    if (intervalDelay == null) {
      intervalDelay = 0;
    }

    const uuid = this._uuidCounter++;

    this._timers.set(String(uuid), {
      callback: () => callback.apply(null, args),
      expiry: this._now + intervalDelay,
      interval: intervalDelay,
      type: 'interval',
    });

    return this._timerConfig.idToRef(uuid);
  }

  private _fakeSetTimeout(
    callback: Callback,
    delay?: number,
    ...args: Array<unknown>
  ) {
    if (this._disposed) {
      return null;
    }

    // eslint-disable-next-line no-bitwise
    delay = Number(delay) | 0;

    const uuid = this._uuidCounter++;

    this._timers.set(String(uuid), {
      callback: () => callback.apply(null, args),
      expiry: this._now + delay,
      interval: undefined,
      type: 'timeout',
    });

    return this._timerConfig.idToRef(uuid);
  }

  private _getNextTimerHandleAndExpiry(): [string, number] | null {
    let nextTimerHandle = null;
    let soonestTime = MS_IN_A_YEAR;

    this._timers.forEach((timer, uuid) => {
      if (timer.expiry < soonestTime) {
        soonestTime = timer.expiry;
        nextTimerHandle = uuid;
      }
    });

    if (nextTimerHandle === null) {
      return null;
    }

    return [nextTimerHandle, soonestTime];
  }

  private _runTimerHandle(timerHandle: TimerID) {
    const timer = this._timers.get(timerHandle);

    if (!timer) {
      // Timer has been cleared - we'll hit this when a timer is cleared within
      // another timer in runOnlyPendingTimers
      return;
    }

    switch (timer.type) {
      case 'timeout':
        this._timers.delete(timerHandle);
        timer.callback();
        break;

      case 'interval':
        timer.expiry = this._now + (timer.interval || 0);
        timer.callback();
        break;

      default:
        throw new Error(`Unexpected timer type: ${timer.type}`);
    }
  }
}
