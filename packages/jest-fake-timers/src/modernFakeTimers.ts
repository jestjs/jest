/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  type FakeTimerWithContext,
  type FakeMethod as FakeableAPI,
  type InstalledClock,
  type FakeTimerInstallOpts as SinonFakeTimersConfig,
  withGlobal,
} from '@sinonjs/fake-timers';
import type {Config} from '@jest/types';
import {formatStackTrace} from 'jest-message-util';

export type TimerTickMode = 'manual' | 'nextAsync' | 'interval';

export default class FakeTimers {
  private _clock!: InstalledClock;
  private _nativeTimeout: typeof setTimeout;
  private readonly _config: Config.ProjectConfig;
  private _fakingTime: boolean;
  private _usingSinonAdvanceTime = false;
  private readonly _global: typeof globalThis;
  private readonly _fakeTimers: FakeTimerWithContext;
  private tickMode: {counter: number; mode: TimerTickMode} = {
    counter: 0,
    mode: 'manual',
  };

  constructor({
    global,
    config,
  }: {
    global: typeof globalThis;
    config: Config.ProjectConfig;
  }) {
    this._global = global;
    this._config = config;
    this._nativeTimeout = global.setTimeout;

    this._fakingTime = false;
    this._fakeTimers = withGlobal(global);
  }

  clearAllTimers(): void {
    if (this._fakingTime) {
      this._clock.reset();
    }
  }

  dispose(): void {
    this.useRealTimers();
  }

  runAllTimers(): void {
    if (this._checkFakeTimers()) {
      this._clock.runAll();
    }
  }

  async runAllTimersAsync(): Promise<void> {
    if (this._checkFakeTimers()) {
      await this._runWithoutNextAsyncTickMode(() => this._clock.runAllAsync());
    }
  }

  runOnlyPendingTimers(): void {
    if (this._checkFakeTimers()) {
      this._clock.runToLast();
    }
  }

  async runOnlyPendingTimersAsync(): Promise<void> {
    if (this._checkFakeTimers()) {
      await this._runWithoutNextAsyncTickMode(() =>
        this._clock.runToLastAsync(),
      );
    }
  }

  advanceTimersToNextTimer(steps = 1): void {
    if (this._checkFakeTimers()) {
      for (let i = steps; i > 0; i--) {
        this._clock.next();
        // Fire all timers at this point: https://github.com/sinonjs/fake-timers/issues/250
        this._clock.tick(0);

        if (this._clock.countTimers() === 0) {
          break;
        }
      }
    }
  }

  async advanceTimersToNextTimerAsync(steps = 1): Promise<void> {
    if (this._checkFakeTimers()) {
      for (let i = steps; i > 0; i--) {
        await this._runWithoutNextAsyncTickMode(async () => {
          await this._clock.nextAsync();
          // Fire all timers at this point: https://github.com/sinonjs/fake-timers/issues/250
          await this._clock.tickAsync(0);
        });

        if (this._clock.countTimers() === 0) {
          break;
        }
      }
    }
  }

  advanceTimersByTime(msToRun: number): void {
    if (this._checkFakeTimers()) {
      this._clock.tick(msToRun);
    }
  }

  async advanceTimersByTimeAsync(msToRun: number): Promise<void> {
    if (this._checkFakeTimers()) {
      await this._runWithoutNextAsyncTickMode(() =>
        this._clock.tickAsync(msToRun),
      );
    }
  }

  advanceTimersToNextFrame(): void {
    if (this._checkFakeTimers()) {
      this._clock.runToFrame();
    }
  }

  runAllTicks(): void {
    if (this._checkFakeTimers()) {
      // @ts-expect-error - doesn't exist?
      this._clock.runMicrotasks();
    }
  }

  useRealTimers(): void {
    if (this._fakingTime) {
      this._clock.uninstall();
      this._fakingTime = false;
    }
  }

  useFakeTimers(fakeTimersConfig?: Config.FakeTimersConfig): void {
    if (this._fakingTime) {
      this._clock.uninstall();
    }

    this._clock = this._fakeTimers.install(
      this._toSinonFakeTimersConfig(fakeTimersConfig),
    );

    this._fakingTime = true;
    if (
      fakeTimersConfig &&
      typeof fakeTimersConfig.advanceTimers === 'object'
    ) {
      this._setTickModeInternal(fakeTimersConfig.advanceTimers.mode);
    }
  }

  setTickMode(newMode: 'nextAsync' | 'manual'): void {
    if (!this._checkFakeTimers()) {
      return;
    }
    if (this._usingSinonAdvanceTime) {
      this._global.console.warn(
        '`setTickMode` cannot be used when fake timers are configured to advance at an interval.' +
          `\nStack Trace:\n${formatStackTrace(
            // eslint-disable-next-line unicorn/error-message
            new Error().stack!,
            this._config,
            {noStackTrace: false},
          )}`,
      );
      return;
    }

    this._setTickModeInternal(newMode);
  }

  private _setTickModeInternal(newMode: TimerTickMode): void {
    if (newMode === this.tickMode.mode) {
      return;
    }

    this.tickMode = {
      counter: this.tickMode.counter + 1,
      mode: newMode,
    };

    if (newMode === 'nextAsync') {
      this._advanceUntilModeChanges();
    }
  }

  reset(): void {
    if (this._checkFakeTimers()) {
      const {now} = this._clock;
      this._clock.reset();
      this._clock.setSystemTime(now);
    }
  }

  setSystemTime(now?: number | Date): void {
    if (this._checkFakeTimers()) {
      this._clock.setSystemTime(now);
    }
  }

  getRealSystemTime(): number {
    return Date.now();
  }

  now(): number {
    if (this._fakingTime) {
      return this._clock.now;
    }
    return Date.now();
  }

  getTimerCount(): number {
    if (this._checkFakeTimers()) {
      return this._clock.countTimers();
    }

    return 0;
  }

  private _checkFakeTimers() {
    if (!this._fakingTime) {
      this._global.console.warn(
        'A function to advance timers was called but the timers APIs are not replaced ' +
          'with fake timers. Call `jest.useFakeTimers()` in this test file or enable ' +
          "fake timers for all tests by setting 'fakeTimers': {'enableGlobally': true} " +
          `in Jest configuration file.\nStack Trace:\n${formatStackTrace(
            // eslint-disable-next-line unicorn/error-message
            new Error().stack!,
            this._config,
            {noStackTrace: false},
          )}`,
      );
    }

    return this._fakingTime;
  }

  private _toSinonFakeTimersConfig(
    fakeTimersConfig: Config.FakeTimersConfig = {},
  ): SinonFakeTimersConfig {
    fakeTimersConfig = {
      ...this._config.fakeTimers,
      ...fakeTimersConfig,
    } as Config.FakeTimersConfig;

    let advanceTimeDelta: number | undefined = undefined;
    let shouldAdvanceTime = false;
    const advanceTimersConfig = fakeTimersConfig.advanceTimers;
    if (typeof advanceTimersConfig === 'number') {
      shouldAdvanceTime = true;
      advanceTimeDelta = advanceTimersConfig;
    } else if (typeof advanceTimersConfig === 'boolean') {
      shouldAdvanceTime = advanceTimersConfig;
    } else if (
      typeof advanceTimersConfig === 'object' &&
      advanceTimersConfig.mode === 'interval'
    ) {
      shouldAdvanceTime = true;
      advanceTimeDelta = advanceTimersConfig.delta;
    }
    this._usingSinonAdvanceTime = shouldAdvanceTime;

    const toFake = new Set(
      Object.keys(this._fakeTimers.timers) as Array<FakeableAPI>,
    );

    if (fakeTimersConfig.doNotFake)
      for (const nameOfFakeableAPI of fakeTimersConfig.doNotFake) {
        toFake.delete(nameOfFakeableAPI);
      }

    return {
      advanceTimeDelta,
      loopLimit: fakeTimersConfig.timerLimit || 100_000,
      now: fakeTimersConfig.now ?? Date.now(),
      shouldAdvanceTime,
      shouldClearNativeTimers: true,
      toFake: [...toFake],
    };
  }

  /**
   * Advances the Clock's time until the mode changes.
   *
   * The time is advanced asynchronously, giving microtasks and events a chance
   * to run before each timer runs.
   */
  private async _advanceUntilModeChanges() {
    if (!this._checkFakeTimers()) {
      return;
    }
    const {counter} = this.tickMode;

    // Wait a macrotask to prevent advancing time immediately when
    await new Promise(resolve => void this._nativeTimeout(resolve));
    while (this.tickMode.counter === counter && this._fakingTime) {
      // nextAsync always resolves in a setTimeout, even when there are no timers.
      // https://github.com/sinonjs/fake-timers/blob/710cafad25abe9465c807efd8ed9cf3a15985fb1/src/fake-timers-src.js#L1517-L1546
      await this._clock.nextAsync();
    }
  }

  /**
   * Temporarily disables the `nextAsync` tick mode while the given function
   * executes. Used to prevent the auto-advance from advancing while the
   * user is waiting for a manually requested async tick.
   */
  private async _runWithoutNextAsyncTickMode(fn: () => Promise<unknown>) {
    let resetModeToNextAsync = false;
    if (this.tickMode.mode === 'nextAsync') {
      this.setTickMode('manual');
      resetModeToNextAsync = true;
    }
    await fn();
    if (resetModeToNextAsync) {
      this.setTickMode('nextAsync');
    }
  }
}
