/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {makeProjectConfig} from '@jest/test-utils';
import FakeTimers from '../modernFakeTimers';

describe('FakeTimers', () => {
  describe('construction', () => {
    it('installs setTimeout mock', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      expect(global.setTimeout).toBeDefined();
    });

    it('installs clearTimeout mock', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      expect(global.clearTimeout).toBeDefined();
    });

    it('installs setInterval mock', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      expect(global.setInterval).toBeDefined();
    });

    it('installs clearInterval mock', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      expect(global.clearInterval).toBeDefined();
    });

    it('mocks process.nextTick if it exists on global', () => {
      const origNextTick = () => {};
      const global = {
        Date,
        clearTimeout,
        process: {
          nextTick: origNextTick,
        },
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      expect(global.process.nextTick).not.toBe(origNextTick);
    });

    it('mocks setImmediate if it exists on global', () => {
      const origSetImmediate = () => {};
      const global = {
        Date,
        clearTimeout,
        process,
        setImmediate: origSetImmediate,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      expect(global.setImmediate).not.toBe(origSetImmediate);
    });

    it('mocks clearImmediate if setImmediate is on global', () => {
      const origSetImmediate = () => {};
      const origClearImmediate = () => {};
      const global = {
        Date,
        clearImmediate: origClearImmediate,
        clearTimeout,
        process,
        setImmediate: origSetImmediate,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      expect(global.clearImmediate).not.toBe(origClearImmediate);
    });
  });

  describe('runAllTicks', () => {
    it('runs all ticks, in order', () => {
      const global = {
        Date,
        clearTimeout,
        process: {
          nextTick: () => {},
        },
        setTimeout,
      } as unknown as typeof globalThis;

      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const runOrder: Array<string> = [];
      const mock1 = jest.fn(() => runOrder.push('mock1'));
      const mock2 = jest.fn(() => runOrder.push('mock2'));

      global.process.nextTick(mock1);
      global.process.nextTick(mock2);

      expect(mock1).toHaveBeenCalledTimes(0);
      expect(mock2).toHaveBeenCalledTimes(0);

      timers.runAllTicks();

      expect(mock1).toHaveBeenCalledTimes(1);
      expect(mock2).toHaveBeenCalledTimes(1);
      expect(runOrder).toEqual(['mock1', 'mock2']);
    });

    it('does nothing when no ticks have been scheduled', () => {
      const nextTick = jest.fn();
      const global = {
        Date,
        clearTimeout,
        process: {
          nextTick,
        },
        setTimeout,
      } as unknown as typeof globalThis;

      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      timers.runAllTicks();

      expect(nextTick).toHaveBeenCalledTimes(0);
    });

    it('only runs a scheduled callback once', () => {
      const global = {
        Date,
        clearTimeout,
        process: {
          nextTick: () => {},
        },
        setTimeout,
      } as unknown as typeof globalThis;

      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const mock1 = jest.fn();
      global.process.nextTick(mock1);
      expect(mock1).toHaveBeenCalledTimes(0);

      timers.runAllTicks();
      expect(mock1).toHaveBeenCalledTimes(1);

      timers.runAllTicks();
      expect(mock1).toHaveBeenCalledTimes(1);
    });

    it('throws before allowing infinite recursion', () => {
      const global = {
        Date,
        clearTimeout,
        process: {
          nextTick: () => {},
        },
        setTimeout,
      } as unknown as typeof globalThis;

      const timers = new FakeTimers({
        config: makeProjectConfig({fakeTimers: {timerLimit: 100}}),
        global,
      });

      timers.useFakeTimers();

      global.process.nextTick(function infinitelyRecursingCallback() {
        global.process.nextTick(infinitelyRecursingCallback);
      });

      expect(() => {
        timers.runAllTicks();
      }).toThrow(
        'Aborting after running 100 timers, assuming an infinite loop!',
      );
    });
  });

  describe('runAllTimers', () => {
    it('runs all timers in order', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const runOrder: Array<string> = [];
      const mock1 = jest.fn(() => runOrder.push('mock1'));
      const mock2 = jest.fn(() => runOrder.push('mock2'));
      const mock3 = jest.fn(() => runOrder.push('mock3'));
      const mock4 = jest.fn(() => runOrder.push('mock4'));
      const mock5 = jest.fn(() => runOrder.push('mock5'));
      const mock6 = jest.fn(() => runOrder.push('mock6'));

      global.setTimeout(mock1, 100);
      global.setTimeout(mock2, NaN);
      global.setTimeout(mock3, 0);
      const intervalHandler = global.setInterval(() => {
        mock4();
        global.clearInterval(intervalHandler);
      }, 200);
      global.setTimeout(mock5, Infinity);
      global.setTimeout(mock6, -Infinity);

      timers.runAllTimers();
      expect(runOrder).toEqual([
        'mock2',
        'mock3',
        'mock5',
        'mock6',
        'mock1',
        'mock4',
      ]);
    });

    it('warns when trying to advance timers while real timers are used', () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {
          // nothing
        });
      const timers = new FakeTimers({
        config: makeProjectConfig({rootDir: __dirname}),
        global: globalThis,
      });
      timers.runAllTimers();
      expect(
        consoleWarnSpy.mock.calls[0][0].split('\nStack Trace')[0],
      ).toMatchSnapshot();
      consoleWarnSpy.mockRestore();
      timers.useRealTimers();
    });

    it('does nothing when no timers have been scheduled', () => {
      const nativeSetTimeout = jest.fn();
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout: nativeSetTimeout,
      } as unknown as typeof globalThis;

      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      timers.runAllTimers();
    });

    it('only runs a setTimeout callback once (ever)', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const fn = jest.fn();
      global.setTimeout(fn, 0);
      expect(fn).toHaveBeenCalledTimes(0);

      timers.runAllTimers();
      expect(fn).toHaveBeenCalledTimes(1);

      timers.runAllTimers();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('runs callbacks with arguments after the interval', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const fn = jest.fn();
      global.setTimeout(fn, 0, 'mockArg1', 'mockArg2');

      timers.runAllTimers();
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('mockArg1', 'mockArg2');
    });

    it("doesn't pass the callback to native setTimeout", () => {
      const nativeSetTimeout = jest.fn();

      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout: nativeSetTimeout,
      } as unknown as typeof globalThis;

      const timers = new FakeTimers({config: makeProjectConfig(), global});
      // @sinonjs/fake-timers uses `setTimeout` during init to figure out if it's in Node or
      // browser env. So clear its calls before we install them into the env
      nativeSetTimeout.mockClear();
      timers.useFakeTimers();

      const mock1 = jest.fn();
      global.setTimeout(mock1, 0);

      timers.runAllTimers();
      expect(mock1).toHaveBeenCalledTimes(1);
      expect(nativeSetTimeout).toHaveBeenCalledTimes(0);
    });

    it('throws before allowing infinite recursion', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({
        config: makeProjectConfig({fakeTimers: {timerLimit: 1000}}),
        global,
      });
      timers.useFakeTimers();

      global.setTimeout(function infinitelyRecursingCallback() {
        global.setTimeout(infinitelyRecursingCallback, 0);
      }, 0);

      expect(() => {
        timers.runAllTimers();
      }).toThrow(
        new Error(
          'Aborting after running 1000 timers, assuming an infinite loop!',
        ),
      );
    });

    it('also clears ticks', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const fn = jest.fn();
      global.setTimeout(() => {
        process.nextTick(fn);
      }, 0);
      expect(fn).toHaveBeenCalledTimes(0);

      timers.runAllTimers();
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('advanceTimersByTime', () => {
    it('runs timers in order', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const runOrder: Array<string> = [];
      const mock1 = jest.fn(() => runOrder.push('mock1'));
      const mock2 = jest.fn(() => runOrder.push('mock2'));
      const mock3 = jest.fn(() => runOrder.push('mock3'));
      const mock4 = jest.fn(() => runOrder.push('mock4'));

      global.setTimeout(mock1, 100);
      global.setTimeout(mock2, 0);
      global.setTimeout(mock3, 0);
      global.setInterval(() => {
        mock4();
      }, 200);

      // Move forward to t=50
      timers.advanceTimersByTime(50);
      expect(runOrder).toEqual(['mock2', 'mock3']);

      // Move forward to t=60
      timers.advanceTimersByTime(10);
      expect(runOrder).toEqual(['mock2', 'mock3']);

      // Move forward to t=100
      timers.advanceTimersByTime(40);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1']);

      // Move forward to t=200
      timers.advanceTimersByTime(100);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4']);

      // Move forward to t=400
      timers.advanceTimersByTime(200);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4', 'mock4']);
    });

    it('does nothing when no timers have been scheduled', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      timers.advanceTimersByTime(100);
    });
  });

  describe('advanceTimersToNextTimer', () => {
    it('runs timers in order', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const runOrder: Array<string> = [];
      const mock1 = jest.fn(() => runOrder.push('mock1'));
      const mock2 = jest.fn(() => runOrder.push('mock2'));
      const mock3 = jest.fn(() => runOrder.push('mock3'));
      const mock4 = jest.fn(() => runOrder.push('mock4'));

      global.setTimeout(mock1, 100);
      global.setTimeout(mock2, 0);
      global.setTimeout(mock3, 0);
      global.setInterval(() => {
        mock4();
      }, 200);

      timers.advanceTimersToNextTimer();
      // Move forward to t=0
      expect(runOrder).toEqual(['mock2', 'mock3']);

      timers.advanceTimersToNextTimer();
      // Move forward to t=100
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1']);

      timers.advanceTimersToNextTimer();
      // Move forward to t=200
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4']);

      timers.advanceTimersToNextTimer();
      // Move forward to t=400
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4', 'mock4']);
    });

    it('run correct amount of steps', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const runOrder: Array<string> = [];
      const mock1 = jest.fn(() => runOrder.push('mock1'));
      const mock2 = jest.fn(() => runOrder.push('mock2'));
      const mock3 = jest.fn(() => runOrder.push('mock3'));
      const mock4 = jest.fn(() => runOrder.push('mock4'));

      global.setTimeout(mock1, 100);
      global.setTimeout(mock2, 0);
      global.setTimeout(mock3, 0);
      global.setInterval(() => {
        mock4();
      }, 200);

      // Move forward to t=100
      timers.advanceTimersToNextTimer(2);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1']);

      // Move forward to t=600
      timers.advanceTimersToNextTimer(3);
      expect(runOrder).toEqual([
        'mock2',
        'mock3',
        'mock1',
        'mock4',
        'mock4',
        'mock4',
      ]);
    });

    it('setTimeout inside setTimeout', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const runOrder: Array<string> = [];
      const mock1 = jest.fn(() => runOrder.push('mock1'));
      const mock2 = jest.fn(() => runOrder.push('mock2'));
      const mock3 = jest.fn(() => runOrder.push('mock3'));
      const mock4 = jest.fn(() => runOrder.push('mock4'));

      global.setTimeout(mock1, 0);
      global.setTimeout(() => {
        mock2();
        global.setTimeout(mock3, 50);
      }, 25);
      global.setTimeout(mock4, 100);

      // Move forward to t=75
      timers.advanceTimersToNextTimer(3);
      expect(runOrder).toEqual(['mock1', 'mock2', 'mock3']);
    });

    it('does nothing when no timers have been scheduled', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      timers.advanceTimersToNextTimer();
    });
  });

  describe('reset', () => {
    it('resets all pending setTimeouts', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const mock1 = jest.fn();
      global.setTimeout(mock1, 100);

      timers.reset();
      timers.runAllTimers();
      expect(mock1).toHaveBeenCalledTimes(0);
    });

    it('resets all pending setIntervals', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const mock1 = jest.fn();
      global.setInterval(mock1, 200);

      timers.reset();
      timers.runAllTimers();
      expect(mock1).toHaveBeenCalledTimes(0);
    });

    it('resets all pending ticks callbacks', () => {
      const global = {
        Date,
        clearTimeout,
        process: {
          nextTick: () => {},
        },
        setImmediate: () => {},
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const mock1 = jest.fn();
      global.process.nextTick(mock1);
      global.setImmediate(mock1);

      timers.reset();
      timers.runAllTicks();
      expect(mock1).toHaveBeenCalledTimes(0);
    });

    it('resets current advanceTimersByTime time cursor', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const mock1 = jest.fn();
      global.setTimeout(mock1, 100);
      timers.advanceTimersByTime(50);

      timers.reset();
      global.setTimeout(mock1, 100);

      timers.advanceTimersByTime(50);
      expect(mock1).toHaveBeenCalledTimes(0);
    });
  });

  describe('runOnlyPendingTimers', () => {
    it('runs all timers in order', () => {
      const nativeSetImmediate = jest.fn();

      const global = {
        Date,
        clearTimeout,
        process,
        setImmediate: nativeSetImmediate,
        setTimeout,
      } as unknown as typeof globalThis;

      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const runOrder: Array<string> = [];

      global.setTimeout(function cb() {
        runOrder.push('mock1');
        global.setTimeout(cb, 100);
      }, 100);

      global.setTimeout(function cb() {
        runOrder.push('mock2');
        global.setTimeout(cb, 50);
      }, 0);

      global.setInterval(() => {
        runOrder.push('mock3');
      }, 200);

      global.setImmediate(() => {
        runOrder.push('mock4');
      });

      global.setImmediate(function cb() {
        runOrder.push('mock5');
        global.setTimeout(cb, 400);
      });

      timers.runOnlyPendingTimers();
      const firsRunOrder = [
        'mock4',
        'mock5',
        'mock2',
        'mock2',
        'mock1',
        'mock2',
        'mock2',
        'mock3',
        'mock1',
        'mock2',
      ];

      expect(runOrder).toEqual(firsRunOrder);

      timers.runOnlyPendingTimers();
      expect(runOrder).toEqual([
        ...firsRunOrder,
        'mock2',
        'mock1',
        'mock2',
        'mock2',
        'mock3',
        'mock5',
        'mock1',
        'mock2',
      ]);
    });

    it('does not run timers that were cleared in another timer', () => {
      const global = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const fn = jest.fn();
      const timer = global.setTimeout(fn, 10);
      global.setTimeout(() => {
        global.clearTimeout(timer);
      }, 0);

      timers.runOnlyPendingTimers();
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('useRealTimers', () => {
    it('resets native timer APIs', () => {
      const nativeSetTimeout = jest.fn();
      const nativeSetInterval = jest.fn();
      const nativeClearTimeout = jest.fn();
      const nativeClearInterval = jest.fn();

      const global = {
        Date,
        clearInterval: nativeClearInterval,
        clearTimeout: nativeClearTimeout,
        process,
        setInterval: nativeSetInterval,
        setTimeout: nativeSetTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      // Ensure that timers has overridden the native timer APIs
      // (because if it didn't, this test might pass when it shouldn't)
      expect(global.setTimeout).not.toBe(nativeSetTimeout);
      expect(global.setInterval).not.toBe(nativeSetInterval);
      expect(global.clearTimeout).not.toBe(nativeClearTimeout);
      expect(global.clearInterval).not.toBe(nativeClearInterval);

      timers.useRealTimers();

      expect(global.setTimeout).toBe(nativeSetTimeout);
      expect(global.setInterval).toBe(nativeSetInterval);
      expect(global.clearTimeout).toBe(nativeClearTimeout);
      expect(global.clearInterval).toBe(nativeClearInterval);
    });

    it('resets native process.nextTick when present', () => {
      const nativeProcessNextTick = jest.fn();

      const global = {
        Date,
        clearTimeout,
        process: {nextTick: nativeProcessNextTick},
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      // Ensure that timers has overridden the native timer APIs
      // (because if it didn't, this test might pass when it shouldn't)
      expect(global.process.nextTick).not.toBe(nativeProcessNextTick);

      timers.useRealTimers();

      expect(global.process.nextTick).toBe(nativeProcessNextTick);
    });

    it('resets native setImmediate when present', () => {
      const nativeSetImmediate = jest.fn();
      const nativeClearImmediate = jest.fn();

      const global = {
        Date,
        clearImmediate: nativeClearImmediate,
        clearTimeout,
        process,
        setImmediate: nativeSetImmediate,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      // Ensure that timers has overridden the native timer APIs
      // (because if it didn't, this test might pass when it shouldn't)
      expect(global.setImmediate).not.toBe(nativeSetImmediate);
      expect(global.clearImmediate).not.toBe(nativeClearImmediate);

      timers.useRealTimers();

      expect(global.setImmediate).toBe(nativeSetImmediate);
      expect(global.clearImmediate).toBe(nativeClearImmediate);
    });
  });

  describe('useFakeTimers', () => {
    it('resets mock timer APIs', () => {
      const nativeSetTimeout = jest.fn();
      const nativeSetInterval = jest.fn();
      const nativeClearTimeout = jest.fn();
      const nativeClearInterval = jest.fn();

      const global = {
        Date,
        clearInterval: nativeClearInterval,
        clearTimeout: nativeClearTimeout,
        process,
        setInterval: nativeSetInterval,
        setTimeout: nativeSetTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useRealTimers();

      // Ensure that the real timers are installed at this point
      // (because if they aren't, this test might pass when it shouldn't)
      expect(global.setTimeout).toBe(nativeSetTimeout);
      expect(global.setInterval).toBe(nativeSetInterval);
      expect(global.clearTimeout).toBe(nativeClearTimeout);
      expect(global.clearInterval).toBe(nativeClearInterval);

      timers.useFakeTimers();

      expect(global.setTimeout).not.toBe(nativeSetTimeout);
      expect(global.setInterval).not.toBe(nativeSetInterval);
      expect(global.clearTimeout).not.toBe(nativeClearTimeout);
      expect(global.clearInterval).not.toBe(nativeClearInterval);
    });

    it('resets mock process.nextTick when present', () => {
      const nativeProcessNextTick = jest.fn();

      const global = {
        Date,
        clearTimeout,
        process: {nextTick: nativeProcessNextTick},
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useRealTimers();

      // Ensure that the real timers are installed at this point
      // (because if they aren't, this test might pass when it shouldn't)
      expect(global.process.nextTick).toBe(nativeProcessNextTick);

      timers.useFakeTimers();

      expect(global.process.nextTick).not.toBe(nativeProcessNextTick);
    });

    it('resets mock setImmediate when present', () => {
      const nativeSetImmediate = jest.fn();
      const nativeClearImmediate = jest.fn();

      const global = {
        Date,
        clearImmediate: nativeClearImmediate,
        clearTimeout,
        process,
        setImmediate: nativeSetImmediate,
        setTimeout,
      } as unknown as typeof globalThis;
      const fakeTimers = new FakeTimers({config: makeProjectConfig(), global});
      fakeTimers.useRealTimers();

      // Ensure that the real timers are installed at this point
      // (because if they aren't, this test might pass when it shouldn't)
      expect(global.setImmediate).toBe(nativeSetImmediate);
      expect(global.clearImmediate).toBe(nativeClearImmediate);

      fakeTimers.useFakeTimers();

      expect(global.setImmediate).not.toBe(nativeSetImmediate);
      expect(global.clearImmediate).not.toBe(nativeClearImmediate);
    });
  });

  describe('getTimerCount', () => {
    let timers: FakeTimers;
    let fakedGlobal: typeof globalThis;
    beforeEach(() => {
      fakedGlobal = {
        Date,
        clearTimeout,
        process,
        setImmediate,
        setTimeout,
      } as unknown as typeof globalThis;
      timers = new FakeTimers({
        config: makeProjectConfig(),
        global: fakedGlobal,
      });

      timers.useFakeTimers();
    });

    afterEach(() => {
      timers.useRealTimers();
    });

    it('returns the correct count', () => {
      fakedGlobal.setTimeout(() => {}, 0);
      fakedGlobal.setTimeout(() => {}, 0);
      fakedGlobal.setTimeout(() => {}, 10);

      expect(timers.getTimerCount()).toBe(3);

      timers.advanceTimersByTime(5);

      expect(timers.getTimerCount()).toBe(1);

      timers.advanceTimersByTime(5);

      expect(timers.getTimerCount()).toBe(0);
    });

    it('includes immediates and ticks', () => {
      fakedGlobal.setTimeout(() => {}, 0);
      fakedGlobal.setImmediate(() => {});
      process.nextTick(() => {});

      expect(timers.getTimerCount()).toBe(3);
    });

    it('not includes cancelled immediates', () => {
      fakedGlobal.setImmediate(() => {});
      expect(timers.getTimerCount()).toBe(1);
      timers.clearAllTimers();

      expect(timers.getTimerCount()).toBe(0);
    });
  });

  describe('advanceTimersToNextTimerAsync', () => {
    it('should advance the clock at the moment of the first scheduled timer', async () => {
      const global = {
        Date,
        Promise,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      timers.setSystemTime(0);

      const spy = jest.fn();
      global.setTimeout(async () => {
        await Promise.resolve();
        global.setTimeout(spy, 100);
      }, 100);

      await timers.advanceTimersToNextTimerAsync();
      expect(timers.now()).toBe(100);

      await timers.advanceTimersToNextTimerAsync();
      expect(timers.now()).toBe(200);
      expect(spy).toHaveBeenCalled();
    });

    it('should advance the clock at the moment of the n-th scheduled timer', async () => {
      const global = {
        Date,
        Promise,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      timers.setSystemTime(0);

      const spy = jest.fn();
      global.setTimeout(async () => {
        await Promise.resolve();
        global.setTimeout(spy, 100);
      }, 100);

      await timers.advanceTimersToNextTimerAsync(2);

      expect(timers.now()).toBe(200);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('runAllTimersAsync', () => {
    it('should advance the clock to the last scheduled timer', async () => {
      const global = {
        Date,
        Promise,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      timers.setSystemTime(0);

      const spy = jest.fn();
      const spy2 = jest.fn();
      global.setTimeout(async () => {
        await Promise.resolve();
        global.setTimeout(spy, 100);
        global.setTimeout(spy2, 200);
      }, 100);

      await timers.runAllTimersAsync();
      expect(timers.now()).toBe(300);
      expect(spy).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });
  });

  describe('runOnlyPendingTimersAsync', () => {
    it('should advance the clock to the last scheduled timer', async () => {
      const global = {
        Date,
        Promise,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();
      timers.setSystemTime(0);

      const spy = jest.fn();
      const spy2 = jest.fn();
      global.setTimeout(spy, 50);
      global.setTimeout(spy2, 50);
      global.setTimeout(async () => {
        await Promise.resolve();
      }, 100);

      await timers.runOnlyPendingTimersAsync();
      expect(timers.now()).toBe(100);
      expect(spy).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });
  });

  describe('advanceTimersByTimeAsync', () => {
    it('should advance the clock', async () => {
      const global = {
        Date,
        Promise,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      const timers = new FakeTimers({config: makeProjectConfig(), global});
      timers.useFakeTimers();

      const spy = jest.fn();
      global.setTimeout(async () => {
        await Promise.resolve();
        global.setTimeout(spy, 100);
      }, 100);

      await timers.advanceTimersByTimeAsync(200);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('now', () => {
    let timers: FakeTimers;
    let fakedGlobal: typeof globalThis;

    beforeEach(() => {
      fakedGlobal = {
        Date,
        clearTimeout,
        process,
        setTimeout,
      } as unknown as typeof globalThis;
      timers = new FakeTimers({
        config: makeProjectConfig(),
        global: fakedGlobal,
      });
    });

    it('returns the current clock', () => {
      timers.useFakeTimers();
      timers.setSystemTime(0);
      fakedGlobal.setTimeout(() => {}, 2);
      fakedGlobal.setTimeout(() => {}, 100);

      expect(timers.now()).toBe(0);

      // This should run the 2ms timer, and then advance _now by 3ms
      timers.advanceTimersByTime(5);
      expect(timers.now()).toBe(5);

      // Advance _now even though there are no timers to run
      timers.advanceTimersByTime(5);
      expect(timers.now()).toBe(10);

      // Run up to the 100ms timer
      timers.runAllTimers();
      expect(timers.now()).toBe(100);

      // Verify that runOnlyPendingTimers advances now only up to the first
      // recursive timer
      fakedGlobal.setTimeout(function infinitelyRecursingCallback() {
        fakedGlobal.setTimeout(infinitelyRecursingCallback, 20);
      }, 10);
      timers.runOnlyPendingTimers();
      expect(timers.now()).toBe(110);

      // For modern timers, reset() explicitly preserves the clock time
      timers.reset();
      expect(timers.now()).toBe(110);
    });

    it('returns the real time if useFakeTimers is not called', () => {
      const before = Date.now();
      const now = timers.now();
      const after = Date.now();
      expect(now).toBeGreaterThanOrEqual(before);
      expect(now).toBeLessThanOrEqual(after);
    });
  });
});
