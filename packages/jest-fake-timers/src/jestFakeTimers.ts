/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  withGlobal as lolexWithGlobal,
  LolexWithContext,
  InstalledClock,
} from 'lolex';
import {formatStackTrace, StackTraceConfig} from 'jest-message-util';

export default class FakeTimers {
  private _clock!: InstalledClock;
  private _config: StackTraceConfig;
  private _fakingTime: boolean;
  private _global: NodeJS.Global;
  private _lolex: LolexWithContext;
  private _maxLoops: number;

  constructor({
    global,
    config,
    maxLoops,
  }: {
    global: NodeJS.Global;
    config: StackTraceConfig;
    maxLoops?: number;
  }) {
    this._global = global;
    this._config = config;
    this._maxLoops = maxLoops || 100000;

    this._fakingTime = false;
    this._lolex = lolexWithGlobal(global);
  }

  clearAllTimers() {
    if (this._fakingTime) {
      this._clock.reset();
    }
  }

  dispose() {
    this.useRealTimers();
  }

  runAllTimers() {
    if (this._checkFakeTimers()) {
      this._clock.runAll();
    }
  }

  runOnlyPendingTimers() {
    if (this._checkFakeTimers()) {
      this._clock.runToLast();
    }
  }

  advanceTimersByTime(msToRun: number) {
    if (this._checkFakeTimers()) {
      this._clock.tick(msToRun);
    }
  }

  runAllTicks() {
    if (this._checkFakeTimers()) {
      // @ts-ignore
      this._clock.runMicrotasks();
    }
  }

  useRealTimers() {
    if (this._fakingTime) {
      this._clock.uninstall();
      this._fakingTime = false;
    }
  }

  useFakeTimers() {
    if (!this._fakingTime) {
      this._clock = this._lolex.install({
        loopLimit: this._maxLoops,
        now: Date.now(),
        target: this._global,
        toFake: [
          'setTimeout',
          'clearTimeout',
          'setImmediate',
          'clearImmediate',
          'setInterval',
          'clearInterval',
          'nextTick',
        ],
      });

      this._fakingTime = true;
    }
  }

  reset() {
    if (this._checkFakeTimers()) {
      this._clock.reset();
    }
  }

  getTimerCount() {
    if (this._checkFakeTimers()) {
      return this._clock.countTimers();
    }

    return 0;
  }

  _checkFakeTimers() {
    if (!this._fakingTime) {
      this._global.console.warn(
        'A function to advance timers was called but the timers API is not ' +
          'mocked with fake timers. Call `jest.useFakeTimers()` in this test or ' +
          'enable fake timers globally by setting `"timers": "fake"` in the ' +
          'configuration file\nStack Trace:\n' +
          formatStackTrace(new Error().stack!, this._config, {
            noStackTrace: false,
          }),
      );
    }

    return this._fakingTime;
  }
}
