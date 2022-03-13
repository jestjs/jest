/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  FakeTimerWithContext,
  InstalledClock,
  withGlobal,
} from '@sinonjs/fake-timers';
import type {Config} from '@jest/types';
import {formatStackTrace} from 'jest-message-util';

export default class FakeTimers {
  private _clock!: InstalledClock;
  private _config: Config.ProjectConfig;
  private _fakingTime: boolean;
  private _global: typeof globalThis;
  private _fakeTimers: FakeTimerWithContext;

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

  runOnlyPendingTimers(): void {
    if (this._checkFakeTimers()) {
      this._clock.runToLast();
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

  advanceTimersByTime(msToRun: number): void {
    if (this._checkFakeTimers()) {
      this._clock.tick(msToRun);
    }
  }

  runAllTicks(): void {
    if (this._checkFakeTimers()) {
      // @ts-expect-error
      this._clock.runMicrotasks();
    }
  }

  useRealTimers(): void {
    if (this._fakingTime) {
      this._clock.uninstall();
      this._fakingTime = false;
    }
  }

  useFakeTimers(timersConfig?: Config.TimersConfig): void {
    if (!this._fakingTime) {
      const toFake = Object.keys(this._fakeTimers.timers) as Array<
        keyof FakeTimerWithContext['timers']
      >;

      const resolvedTimersConfig = {
        now: Date.now(),
        toFake,
        ...this._config.timers,
        ...timersConfig,
      } as Config.ModernTimersConfig;

      this._clock = this._fakeTimers.install({
        advanceTimeDelta: resolvedTimersConfig.advanceTimeDelta,
        loopLimit: resolvedTimersConfig.timerLimit,
        now: resolvedTimersConfig.now,
        shouldAdvanceTime: resolvedTimersConfig.shouldAdvanceTime,
        shouldClearNativeTimers: resolvedTimersConfig.shouldClearNativeTimers,
        toFake: resolvedTimersConfig.toFake,
      });

      this._fakingTime = true;
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

  getTimerCount(): number {
    if (this._checkFakeTimers()) {
      return this._clock.countTimers();
    }

    return 0;
  }

  private _checkFakeTimers() {
    if (!this._fakingTime) {
      this._global.console.warn(
        'A function to advance timers was called but the timers API is not ' +
          'mocked with fake timers. Call `jest.useFakeTimers()` in this test or ' +
          'enable fake timers globally using "timers" option in the Jest ' +
          `configuration file\nStack Trace:\n${formatStackTrace(
            new Error().stack!,
            this._config,
            {noStackTrace: false},
          )}`,
      );
    }

    return this._fakingTime;
  }
}
