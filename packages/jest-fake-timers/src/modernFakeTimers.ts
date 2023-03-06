/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  FakeTimerWithContext,
  FakeMethod as FakeableAPI,
  InstalledClock,
  FakeTimerInstallOpts as SinonFakeTimersConfig,
  withGlobal,
} from '@sinonjs/fake-timers';
import type {Config} from '@jest/types';
import {formatStackTrace} from 'jest-message-util';

export default class FakeTimers {
  private _clock!: InstalledClock;
  private readonly _config: Config.ProjectConfig;
  private _fakingTime: boolean;
  private readonly _global: typeof globalThis;
  private readonly _fakeTimers: FakeTimerWithContext;

  constructor({
    global,
    config,
  }: {
    global: typeof globalThis;
    config: Config.ProjectConfig;
  }) {
    this._global = global;
    this._config = config;

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
      await this._clock.runAllAsync();
    }
  }

  runOnlyPendingTimers(): void {
    if (this._checkFakeTimers()) {
      this._clock.runToLast();
    }
  }

  async runOnlyPendingTimersAsync(): Promise<void> {
    if (this._checkFakeTimers()) {
      await this._clock.runToLastAsync();
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
        await this._clock.nextAsync();
        // Fire all timers at this point: https://github.com/sinonjs/fake-timers/issues/250
        await this._clock.tickAsync(0);

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
      await this._clock.tickAsync(msToRun);
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

    const advanceTimeDelta =
      typeof fakeTimersConfig.advanceTimers === 'number'
        ? fakeTimersConfig.advanceTimers
        : undefined;

    const toFake = new Set(
      Object.keys(this._fakeTimers.timers) as Array<FakeableAPI>,
    );

    fakeTimersConfig.doNotFake?.forEach(nameOfFakeableAPI => {
      toFake.delete(nameOfFakeableAPI);
    });

    return {
      advanceTimeDelta,
      loopLimit: fakeTimersConfig.timerLimit || 100_000,
      now: fakeTimersConfig.now ?? Date.now(),
      shouldAdvanceTime: Boolean(fakeTimersConfig.advanceTimers),
      shouldClearNativeTimers: true,
      toFake: Array.from(toFake),
    };
  }
}
