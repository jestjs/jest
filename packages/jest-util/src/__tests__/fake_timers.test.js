/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

const vm = require('vm');

describe('FakeTimers', () => {
  let FakeTimers, moduleMocker;

  beforeEach(() => {
    FakeTimers = require('../fake_timers');
    const mock = require('jest-mock');
    const global = vm.runInNewContext('this');
    moduleMocker = new mock.ModuleMocker(global);
  });

  describe('construction', () => {
    /* eslint-disable no-new */
    it('installs setTimeout mock', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();
      expect(global.setTimeout).not.toBe(undefined);
    });

    it('installs clearTimeout mock', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();
      expect(global.clearTimeout).not.toBe(undefined);
    });

    it('installs setInterval mock', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();
      expect(global.setInterval).not.toBe(undefined);
    });

    it('installs clearInterval mock', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();
      expect(global.clearInterval).not.toBe(undefined);
    });

    it('mocks process.nextTick if it exists on global', () => {
      const origNextTick = () => {};
      const global = {
        process: {
          nextTick: origNextTick,
        },
      };
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();
      expect(global.process.nextTick).not.toBe(origNextTick);
    });

    it('mocks setImmediate if it exists on global', () => {
      const origSetImmediate = () => {};
      const global = {
        process,
        setImmediate: origSetImmediate,
      };
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();
      expect(global.setImmediate).not.toBe(origSetImmediate);
    });

    it('mocks clearImmediate if setImmediate is on global', () => {
      const origSetImmediate = () => {};
      const origClearImmediate = () => {};
      const global = {
        clearImmediate: origClearImmediate,
        process,
        setImmediate: origSetImmediate,
      };
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();
      expect(global.clearImmediate).not.toBe(origClearImmediate);
    });
  });

  describe('runAllTicks', () => {
    it('runs all ticks, in order', () => {
      const global = {
        process: {
          nextTick: () => {},
        },
      };

      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const runOrder = [];
      const mock1 = jest.fn(() => runOrder.push('mock1'));
      const mock2 = jest.fn(() => runOrder.push('mock2'));

      global.process.nextTick(mock1);
      global.process.nextTick(mock2);

      expect(mock1.mock.calls.length).toBe(0);
      expect(mock2.mock.calls.length).toBe(0);

      timers.runAllTicks();

      expect(mock1.mock.calls.length).toBe(1);
      expect(mock2.mock.calls.length).toBe(1);
      expect(runOrder).toEqual(['mock1', 'mock2']);
    });

    it('does nothing when no ticks have been scheduled', () => {
      const nextTick = jest.genMockFn();
      const global = {
        process: {
          nextTick,
        },
      };

      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();
      timers.runAllTicks();

      expect(nextTick.mock.calls.length).toBe(0);
    });

    it('only runs a scheduled callback once', () => {
      const global = {
        process: {
          nextTick: () => {},
        },
      };

      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const mock1 = jest.genMockFn();
      global.process.nextTick(mock1);
      expect(mock1.mock.calls.length).toBe(0);

      timers.runAllTicks();
      expect(mock1.mock.calls.length).toBe(1);

      timers.runAllTicks();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('cancels a callback even from native nextTick', () => {
      const nativeNextTick = jest.genMockFn();

      const global = {
        process: {
          nextTick: nativeNextTick,
        },
      };

      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const mock1 = jest.genMockFn();
      global.process.nextTick(mock1);
      timers.runAllTicks();
      expect(mock1.mock.calls.length).toBe(1);
      expect(nativeNextTick.mock.calls.length).toBe(1);

      // Now imagine we fast forward to the next real tick. We need to be sure
      // that native nextTick doesn't try to run the callback again
      nativeNextTick.mock.calls[0][0]();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('cancels a callback even from native setImmediate', () => {
      const nativeSetImmediate = jest.genMockFn();

      const global = {
        process,
        setImmediate: nativeSetImmediate,
      };

      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const mock1 = jest.genMockFn();
      global.setImmediate(mock1);
      timers.runAllImmediates();
      expect(mock1.mock.calls.length).toBe(1);
      expect(nativeSetImmediate.mock.calls.length).toBe(1);

      // ensure that native setImmediate doesn't try to run the callback again
      nativeSetImmediate.mock.calls[0][0]();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('doesnt run a tick callback if native nextTick already did', () => {
      const nativeNextTick = jest.genMockFn();

      const global = {
        process: {
          nextTick: nativeNextTick,
        },
      };

      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const mock1 = jest.genMockFn();
      global.process.nextTick(mock1);

      // Emulate native nextTick running...
      nativeNextTick.mock.calls[0][0]();
      expect(mock1.mock.calls.length).toBe(1);

      // Ensure runAllTicks() doesn't run the callback again
      timers.runAllTicks();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('doesnt run immediate if native setImmediate already did', () => {
      const nativeSetImmediate = jest.genMockFn();

      const global = {
        process,
        setImmediate: nativeSetImmediate,
      };

      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const mock1 = jest.genMockFn();
      global.setImmediate(mock1);

      // Emulate native setImmediate running...
      nativeSetImmediate.mock.calls[0][0]();
      expect(mock1.mock.calls.length).toBe(1);

      // Ensure runAllTicks() doesn't run the callback again
      timers.runAllImmediates();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('native doesnt run immediate if fake already did', () => {
      const nativeSetImmediate = jest.genMockFn();

      const global = {
        process,
        setImmediate: nativeSetImmediate,
      };

      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const mock1 = jest.genMockFn();
      global.setImmediate(mock1);

      //run all immediates now
      timers.runAllImmediates();
      expect(mock1.mock.calls.length).toBe(1);

      // Emulate native setImmediate running ensuring it doesn't re-run
      nativeSetImmediate.mock.calls[0][0]();

      expect(mock1.mock.calls.length).toBe(1);
    });

    it('throws before allowing infinite recursion', () => {
      const global = {
        process: {
          nextTick: () => {},
        },
      };

      const timers = new FakeTimers(global, moduleMocker, null, 100);
      timers.useFakeTimers();

      global.process.nextTick(function infinitelyRecursingCallback() {
        global.process.nextTick(infinitelyRecursingCallback);
      });

      expect(() => {
        timers.runAllTicks();
      }).toThrow(
        new Error(
          "Ran 100 ticks, and there are still more! Assuming we've hit an " +
            'infinite recursion and bailing out...',
        ),
      );
    });
  });

  describe('runAllTimers', () => {
    it('runs all timers in order', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const runOrder = [];
      const mock1 = jest.fn(() => runOrder.push('mock1'));
      const mock2 = jest.fn(() => runOrder.push('mock2'));
      const mock3 = jest.fn(() => runOrder.push('mock3'));
      const mock4 = jest.fn(() => runOrder.push('mock4'));

      global.setTimeout(mock1, 100);
      global.setTimeout(mock2, 0);
      global.setTimeout(mock3, 0);
      const intervalHandler = global.setInterval(() => {
        mock4();
        global.clearInterval(intervalHandler);
      }, 200);

      timers.runAllTimers();
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4']);
    });

    it('warns when trying to advance timers while real timers are used', () => {
      const consoleWarn = console.warn;
      console.warn = jest.fn();
      const timers = new FakeTimers(global, moduleMocker, {rootDir: __dirname});
      timers.runAllTimers();
      expect(
        console.warn.mock.calls[0][0].split('\nStack Trace')[0],
      ).toMatchSnapshot();
      console.warn = consoleWarn;
    });

    it('does nothing when no timers have been scheduled', () => {
      const nativeSetTimeout = jest.genMockFn();
      const global = {
        process,
        setTimeout: nativeSetTimeout,
      };

      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();
      timers.runAllTimers();
    });

    it('only runs a setTimeout callback once (ever)', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const fn = jest.genMockFn();
      global.setTimeout(fn, 0);
      expect(fn.mock.calls.length).toBe(0);

      timers.runAllTimers();
      expect(fn.mock.calls.length).toBe(1);

      timers.runAllTimers();
      expect(fn.mock.calls.length).toBe(1);
    });

    it('runs callbacks with arguments after the interval', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const fn = jest.genMockFn();
      global.setTimeout(fn, 0, 'mockArg1', 'mockArg2');

      timers.runAllTimers();
      expect(fn.mock.calls).toEqual([['mockArg1', 'mockArg2']]);
    });

    it('doesnt pass the callback to native setTimeout', () => {
      const nativeSetTimeout = jest.genMockFn();

      const global = {
        process,
        setTimeout: nativeSetTimeout,
      };

      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const mock1 = jest.genMockFn();
      global.setTimeout(mock1, 0);

      timers.runAllTimers();
      expect(mock1.mock.calls.length).toBe(1);
      expect(nativeSetTimeout.mock.calls.length).toBe(0);
    });

    it('throws before allowing infinite recursion', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker, null, 100);
      timers.useFakeTimers();

      global.setTimeout(function infinitelyRecursingCallback() {
        global.setTimeout(infinitelyRecursingCallback, 0);
      }, 0);

      expect(() => {
        timers.runAllTimers();
      }).toThrow(
        new Error(
          "Ran 100 timers, and there are still more! Assuming we've hit an " +
            'infinite recursion and bailing out...',
        ),
      );
    });

    it('also clears ticks', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const fn = jest.genMockFn();
      global.setTimeout(() => {
        process.nextTick(fn);
      }, 0);
      expect(fn.mock.calls.length).toBe(0);

      timers.runAllTimers();
      expect(fn.mock.calls.length).toBe(1);
    });
  });

  describe('runTimersToTime', () => {
    it('runs timers in order', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const runOrder = [];
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
      timers.runTimersToTime(50);
      expect(runOrder).toEqual(['mock2', 'mock3']);

      // Move forward to t=60
      timers.runTimersToTime(10);
      expect(runOrder).toEqual(['mock2', 'mock3']);

      // Move forward to t=100
      timers.runTimersToTime(40);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1']);

      // Move forward to t=200
      timers.runTimersToTime(100);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4']);

      // Move forward to t=400
      timers.runTimersToTime(200);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4', 'mock4']);
    });

    it('does nothing when no timers have been scheduled', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      timers.runTimersToTime(100);
    });

    it('throws before allowing infinite recursion', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker, null, 100);
      timers.useFakeTimers();

      global.setTimeout(function infinitelyRecursingCallback() {
        global.setTimeout(infinitelyRecursingCallback, 0);
      }, 0);

      expect(() => {
        timers.runTimersToTime(50);
      }).toThrow(
        new Error(
          "Ran 100 timers, and there are still more! Assuming we've hit an " +
            'infinite recursion and bailing out...',
        ),
      );
    });
  });

  describe('reset', () => {
    it('resets all pending setTimeouts', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const mock1 = jest.genMockFn();
      global.setTimeout(mock1, 100);

      timers.reset();
      timers.runAllTimers();
      expect(mock1.mock.calls.length).toBe(0);
    });

    it('resets all pending setIntervals', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const mock1 = jest.genMockFn();
      global.setInterval(mock1, 200);

      timers.reset();
      timers.runAllTimers();
      expect(mock1.mock.calls.length).toBe(0);
    });

    it('resets all pending ticks callbacks & immediates', () => {
      const global = {
        process: {
          nextTick: () => {},
        },
        setImmediate: () => {},
      };
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const mock1 = jest.genMockFn();
      global.process.nextTick(mock1);
      global.setImmediate(mock1);

      timers.reset();
      timers.runAllTicks();
      timers.runAllImmediates();
      expect(mock1.mock.calls.length).toBe(0);
    });

    it('resets current runTimersToTime time cursor', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const mock1 = jest.genMockFn();
      global.setTimeout(mock1, 100);
      timers.runTimersToTime(50);

      timers.reset();
      global.setTimeout(mock1, 100);

      timers.runTimersToTime(50);
      expect(mock1.mock.calls.length).toBe(0);
    });
  });

  describe('runOnlyPendingTimers', () => {
    it('runs all timers in order', () => {
      const nativeSetImmediate = jest.genMockFn();

      const global = {
        process,
        setImmediate: nativeSetImmediate,
      };

      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const runOrder = [];

      global.setTimeout(function cb() {
        runOrder.push('mock1');
        global.setTimeout(cb, 100);
      }, 100);

      global.setTimeout(function cb() {
        runOrder.push('mock2');
        global.setTimeout(cb, 0);
      }, 0);

      global.setInterval(() => {
        runOrder.push('mock3');
      }, 200);

      global.setImmediate(() => {
        runOrder.push('mock4');
      });

      timers.runOnlyPendingTimers();
      expect(runOrder).toEqual(['mock4', 'mock2', 'mock1', 'mock3']);

      timers.runOnlyPendingTimers();
      expect(runOrder).toEqual([
        'mock4',
        'mock2',
        'mock1',
        'mock3',

        'mock2',
        'mock1',
        'mock3',
      ]);
    });

    it('does not run timers that were cleared in another timer', () => {
      const global = {process};
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      const fn = jest.genMockFn();
      const timer = global.setTimeout(fn, 10);
      global.setTimeout(() => {
        global.clearTimeout(timer);
      }, 0);

      timers.runOnlyPendingTimers();
      expect(fn).not.toBeCalled();
    });
  });

  describe('runWithRealTimers', () => {
    it('executes callback with native timers', () => {
      const nativeClearInterval = jest.genMockFn();
      const nativeClearTimeout = jest.genMockFn();
      const nativeSetInterval = jest.genMockFn();
      const nativeSetTimeout = jest.genMockFn();

      const global = {
        clearInterval: nativeClearInterval,
        clearTimeout: nativeClearTimeout,
        process,
        setInterval: nativeSetInterval,
        setTimeout: nativeSetTimeout,
      };
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      // clearInterval()
      timers.runWithRealTimers(() => {
        global.clearInterval();
      });
      expect(nativeClearInterval.mock.calls.length).toBe(1);
      expect(global.clearInterval.mock.calls.length).toBe(0);

      // clearTimeout()
      timers.runWithRealTimers(() => {
        global.clearTimeout();
      });
      expect(nativeClearTimeout.mock.calls.length).toBe(1);
      expect(global.clearTimeout.mock.calls.length).toBe(0);

      // setInterval()
      timers.runWithRealTimers(() => {
        global.setInterval();
      });
      expect(nativeSetInterval.mock.calls.length).toBe(1);
      expect(global.setInterval.mock.calls.length).toBe(0);

      // setTimeout()
      timers.runWithRealTimers(() => {
        global.setTimeout();
      });
      expect(nativeSetTimeout.mock.calls.length).toBe(1);
      expect(global.setTimeout.mock.calls.length).toBe(0);
    });

    it('resets mock timers after executing callback', () => {
      const nativeClearInterval = jest.genMockFn();
      const nativeClearTimeout = jest.genMockFn();
      const nativeSetInterval = jest.genMockFn();
      const nativeSetTimeout = jest.genMockFn();

      const global = {
        clearInterval: nativeClearInterval,
        clearTimeout: nativeClearTimeout,
        process,
        setInterval: nativeSetInterval,
        setTimeout: nativeSetTimeout,
      };
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      // clearInterval()
      timers.runWithRealTimers(() => {
        global.clearInterval();
      });
      expect(nativeClearInterval.mock.calls.length).toBe(1);
      expect(global.clearInterval.mock.calls.length).toBe(0);

      global.clearInterval();
      expect(nativeClearInterval.mock.calls.length).toBe(1);
      expect(global.clearInterval.mock.calls.length).toBe(1);

      // clearTimeout()
      timers.runWithRealTimers(() => {
        global.clearTimeout();
      });
      expect(nativeClearTimeout.mock.calls.length).toBe(1);
      expect(global.clearTimeout.mock.calls.length).toBe(0);

      global.clearTimeout();
      expect(nativeClearTimeout.mock.calls.length).toBe(1);
      expect(global.clearTimeout.mock.calls.length).toBe(1);

      // setInterval()
      timers.runWithRealTimers(() => {
        global.setInterval();
      });
      expect(nativeSetInterval.mock.calls.length).toBe(1);
      expect(global.setInterval.mock.calls.length).toBe(0);

      global.setInterval();
      expect(nativeSetInterval.mock.calls.length).toBe(1);
      expect(global.setInterval.mock.calls.length).toBe(1);

      // setTimeout()
      timers.runWithRealTimers(() => {
        global.setTimeout();
      });
      expect(nativeSetTimeout.mock.calls.length).toBe(1);
      expect(global.setTimeout.mock.calls.length).toBe(0);

      global.setTimeout();
      expect(nativeSetTimeout.mock.calls.length).toBe(1);
      expect(global.setTimeout.mock.calls.length).toBe(1);
    });

    it('resets mock timer functions even if callback throws', () => {
      const nativeSetTimeout = jest.genMockFn();
      const global = {
        process,
        setTimeout: nativeSetTimeout,
      };
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      expect(() => {
        timers.runWithRealTimers(() => {
          global.setTimeout();
          throw new Error('test');
        });
      }).toThrow(new Error('test'));
      expect(nativeSetTimeout.mock.calls.length).toBe(1);
      expect(global.setTimeout.mock.calls.length).toBe(0);

      global.setTimeout();
      expect(nativeSetTimeout.mock.calls.length).toBe(1);
      expect(global.setTimeout.mock.calls.length).toBe(1);
    });
  });

  describe('useRealTimers', () => {
    it('resets native timer APIs', () => {
      const nativeSetTimeout = jest.genMockFn();
      const nativeSetInterval = jest.genMockFn();
      const nativeClearTimeout = jest.genMockFn();
      const nativeClearInterval = jest.genMockFn();

      const global = {
        clearInterval: nativeClearInterval,
        clearTimeout: nativeClearTimeout,
        process,
        setInterval: nativeSetInterval,
        setTimeout: nativeSetTimeout,
      };
      const timers = new FakeTimers(global, moduleMocker);
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
      const nativeProcessNextTick = jest.genMockFn();

      const global = {
        process: {nextTick: nativeProcessNextTick},
      };
      const timers = new FakeTimers(global, moduleMocker);
      timers.useFakeTimers();

      // Ensure that timers has overridden the native timer APIs
      // (because if it didn't, this test might pass when it shouldn't)
      expect(global.process.nextTick).not.toBe(nativeProcessNextTick);

      timers.useRealTimers();

      expect(global.process.nextTick).toBe(nativeProcessNextTick);
    });

    it('resets native setImmediate when present', () => {
      const nativeSetImmediate = jest.genMockFn();
      const nativeClearImmediate = jest.genMockFn();

      const global = {
        clearImmediate: nativeClearImmediate,
        process,
        setImmediate: nativeSetImmediate,
      };
      const timers = new FakeTimers(global, moduleMocker);
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
      const nativeSetTimeout = jest.genMockFn();
      const nativeSetInterval = jest.genMockFn();
      const nativeClearTimeout = jest.genMockFn();
      const nativeClearInterval = jest.genMockFn();

      const global = {
        clearInterval: nativeClearInterval,
        clearTimeout: nativeClearTimeout,
        process,
        setInterval: nativeSetInterval,
        setTimeout: nativeSetTimeout,
      };
      const timers = new FakeTimers(global, moduleMocker);
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
      const nativeProcessNextTick = jest.genMockFn();

      const global = {
        process: {nextTick: nativeProcessNextTick},
      };
      const timers = new FakeTimers(global, moduleMocker);
      timers.useRealTimers();

      // Ensure that the real timers are installed at this point
      // (because if they aren't, this test might pass when it shouldn't)
      expect(global.process.nextTick).toBe(nativeProcessNextTick);

      timers.useFakeTimers();

      expect(global.process.nextTick).not.toBe(nativeProcessNextTick);
    });

    it('resets mock setImmediate when present', () => {
      const nativeSetImmediate = jest.genMockFn();
      const nativeClearImmediate = jest.genMockFn();

      const global = {
        clearImmediate: nativeClearImmediate,
        process,
        setImmediate: nativeSetImmediate,
      };
      const fakeTimers = new FakeTimers(global, moduleMocker);
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
});
