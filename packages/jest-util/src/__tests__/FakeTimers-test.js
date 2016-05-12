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

jest.disableAutomock();

describe('FakeTimers', () => {
  let FakeTimers;

  beforeEach(() => {
    FakeTimers = require('../FakeTimers');
  });

  describe('construction', () => {
    /* eslint-disable no-new */
    it('installs setTimeout mock', () => {
      const global = {};
      new FakeTimers(global);
      expect(global.setTimeout).not.toBe(undefined);
    });

    it('installs clearTimeout mock', () => {
      const global = {};
      new FakeTimers(global);
      expect(global.clearTimeout).not.toBe(undefined);
    });

    it('installs setInterval mock', () => {
      const global = {};
      new FakeTimers(global);
      expect(global.setInterval).not.toBe(undefined);
    });

    it('installs clearInterval mock', () => {
      const global = {};
      new FakeTimers(global);
      expect(global.clearInterval).not.toBe(undefined);
    });

    it('mocks process.nextTick if on exists on global', () => {
      const origNextTick = () => {};
      const global = {
        process: {
          nextTick: origNextTick,
        },
      };
      new FakeTimers(global);
      expect(global.process.nextTick).not.toBe(origNextTick);
    });

    it('doesn\'t mock process.nextTick if real impl isnt present', () => {
      const global = {};
      new FakeTimers(global);
      expect(global.process).toBe(undefined);
    });

    it('mocks setImmediate if it exists on global', () => {
      const origSetImmediate = () => {};
      const global = {
        setImmediate: origSetImmediate,
      };
      new FakeTimers(global);
      expect(global.setImmediate).not.toBe(origSetImmediate);
    });

    it('mocks clearImmediate if setImmediate is on global', () => {
      const origSetImmediate = () => {};
      const origClearImmediate = () => {};
      const global = {
        setImmediate: origSetImmediate,
        clearImmediate: origClearImmediate,
      };
      new FakeTimers(global);
      expect(global.clearImmediate).not.toBe(origClearImmediate);
    });

    it('doesn\'t mock setImmediate if real impl isnt present', () => {
      const global = {};
      new FakeTimers(global);
      expect(global.setImmediate).toBe(undefined);
    });

    it('doesnt mock clearImmediate if real immediate isnt present', () => {
      const global = {};
      new FakeTimers(global);
      expect(global.clearImmediate).toBe(undefined);
    });
  });

  describe('runAllTicks', () => {
    it('runs all ticks, in order', () => {
      const global = {
        process: {
          nextTick: () => {},
        },
      };

      const fakeTimers = new FakeTimers(global);

      const runOrder = [];
      const mock1 = jest.genMockFn().mockImpl(() => {
        runOrder.push('mock1');
      });
      const mock2 = jest.genMockFn().mockImpl(() => {
        runOrder.push('mock2');
      });

      global.process.nextTick(mock1);
      global.process.nextTick(mock2);

      expect(mock1.mock.calls.length).toBe(0);
      expect(mock2.mock.calls.length).toBe(0);

      fakeTimers.runAllTicks();

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

      const fakeTimers = new FakeTimers(global);
      fakeTimers.runAllTicks();

      expect(nextTick.mock.calls.length).toBe(0);
    });

    it('only runs a scheduled callback once', () => {
      const global = {
        process: {
          nextTick: () => {},
        },
      };

      const fakeTimers = new FakeTimers(global);

      const mock1 = jest.genMockFn();
      global.process.nextTick(mock1);
      expect(mock1.mock.calls.length).toBe(0);

      fakeTimers.runAllTicks();
      expect(mock1.mock.calls.length).toBe(1);

      fakeTimers.runAllTicks();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('cancels a callback even from native nextTick', () => {
      const nativeNextTick = jest.genMockFn();

      const global = {
        process: {
          nextTick: nativeNextTick,
        },
      };

      const fakeTimers = new FakeTimers(global);

      const mock1 = jest.genMockFn();
      global.process.nextTick(mock1);
      fakeTimers.runAllTicks();
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
        setImmediate: nativeSetImmediate,
      };

      const fakeTimers = new FakeTimers(global);

      const mock1 = jest.genMockFn();
      global.setImmediate(mock1);
      fakeTimers.runAllImmediates();
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

      const fakeTimers = new FakeTimers(global);

      const mock1 = jest.genMockFn();
      global.process.nextTick(mock1);

      // Emulate native nextTick running...
      nativeNextTick.mock.calls[0][0]();
      expect(mock1.mock.calls.length).toBe(1);

      // Ensure runAllTicks() doesn't run the callback again
      fakeTimers.runAllTicks();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('doesnt run immediate if native setImmediate already did', () => {
      const nativeSetImmediate = jest.genMockFn();

      const global = {
        setImmediate: nativeSetImmediate,
      };

      const fakeTimers = new FakeTimers(global);

      const mock1 = jest.genMockFn();
      global.setImmediate(mock1);

      // Emulate native setImmediate running...
      nativeSetImmediate.mock.calls[0][0]();
      expect(mock1.mock.calls.length).toBe(1);

      // Ensure runAllTicks() doesn't run the callback again
      fakeTimers.runAllImmediates();
      expect(mock1.mock.calls.length).toBe(1);
    });

    it('native doesnt run immediate if fake already did', () => {
      const nativeSetImmediate = jest.genMockFn();

      const global = {
        setImmediate: nativeSetImmediate,
      };

      const fakeTimers = new FakeTimers(global);

      const mock1 = jest.genMockFn();
      global.setImmediate(mock1);

      //run all immediates now
      fakeTimers.runAllImmediates();
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

      const fakeTimers = new FakeTimers(global, 100);

      global.process.nextTick(function infinitelyRecursingCallback() {
        global.process.nextTick(infinitelyRecursingCallback);
      });

      expect(() => {
        fakeTimers.runAllTicks();
      }).toThrow(new Error(
        'Ran 100 ticks, and there are still more! Assuming we\'ve hit an ' +
        'infinite recursion and bailing out...'
      ));
    });
  });

  describe('runAllTimers', () => {
    it('runs all timers in order', () => {
      const global = {};
      const fakeTimers = new FakeTimers(global);

      const runOrder = [];
      const mock1 = jest.genMockFn().mockImpl(() => {
        runOrder.push('mock1');
      });
      const mock2 = jest.genMockFn().mockImpl(() => {
        runOrder.push('mock2');
      });
      const mock3 = jest.genMockFn().mockImpl(() => {
        runOrder.push('mock3');
      });
      const mock4 = jest.genMockFn().mockImpl(() => {
        runOrder.push('mock4');
      });

      global.setTimeout(mock1, 100);
      global.setTimeout(mock2, 0);
      global.setTimeout(mock3, 0);
      const intervalHandler = global.setInterval(() => {
        mock4();
        global.clearInterval(intervalHandler);
      }, 200);

      fakeTimers.runAllTimers();
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4']);
    });

    it('does nothing when no timers have been scheduled', () => {
      const nativeSetTimeout = jest.genMockFn();
      const global = {
        setTimeout: nativeSetTimeout,
      };

      const fakeTimers = new FakeTimers(global);
      fakeTimers.runAllTimers();
    });

    it('only runs a setTimeout callback once (ever)', () => {
      const global = {};
      const fakeTimers = new FakeTimers(global);

      const fn = jest.genMockFn();
      global.setTimeout(fn, 0);
      expect(fn.mock.calls.length).toBe(0);

      fakeTimers.runAllTimers();
      expect(fn.mock.calls.length).toBe(1);

      fakeTimers.runAllTimers();
      expect(fn.mock.calls.length).toBe(1);
    });

    it('runs callbacks with arguments after the interval', () => {
      const global = {};
      const fakeTimers = new FakeTimers(global);

      const fn = jest.genMockFn();
      global.setTimeout(fn, 0, 'mockArg1', 'mockArg2');

      fakeTimers.runAllTimers();
      expect(fn.mock.calls).toEqual([
        ['mockArg1', 'mockArg2'],
      ]);
    });

    it('doesnt pass the callback to native setTimeout', () => {
      const nativeSetTimeout = jest.genMockFn();

      const global = {
        setTimeout: nativeSetTimeout,
      };

      const fakeTimers = new FakeTimers(global);

      const mock1 = jest.genMockFn();
      global.setTimeout(mock1, 0);

      fakeTimers.runAllTimers();
      expect(mock1.mock.calls.length).toBe(1);
      expect(nativeSetTimeout.mock.calls.length).toBe(0);
    });

    it('throws before allowing infinite recursion', () => {
      const global = {};
      const fakeTimers = new FakeTimers(global, 100);

      global.setTimeout(function infinitelyRecursingCallback() {
        global.setTimeout(infinitelyRecursingCallback, 0);
      }, 0);

      expect(() => {
        fakeTimers.runAllTimers();
      }).toThrow(new Error(
        'Ran 100 timers, and there are still more! Assuming we\'ve hit an ' +
        'infinite recursion and bailing out...'
      ));
    });
  });

  describe('runTimersToTime', () => {
    it('runs timers in order', () => {
      const global = {};
      const fakeTimers = new FakeTimers(global);

      const runOrder = [];
      const mock1 = jest.genMockFn().mockImpl(() => {
        runOrder.push('mock1');
      });
      const mock2 = jest.genMockFn().mockImpl(() => {
        runOrder.push('mock2');
      });
      const mock3 = jest.genMockFn().mockImpl(() => {
        runOrder.push('mock3');
      });
      const mock4 = jest.genMockFn().mockImpl(() => {
        runOrder.push('mock4');
      });

      global.setTimeout(mock1, 100);
      global.setTimeout(mock2, 0);
      global.setTimeout(mock3, 0);
      global.setInterval(() => {
        mock4();
      }, 200);

      // Move forward to t=50
      fakeTimers.runTimersToTime(50);
      expect(runOrder).toEqual(['mock2', 'mock3']);

      // Move forward to t=60
      fakeTimers.runTimersToTime(10);
      expect(runOrder).toEqual(['mock2', 'mock3']);

      // Move forward to t=100
      fakeTimers.runTimersToTime(40);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1']);

      // Move forward to t=200
      fakeTimers.runTimersToTime(100);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4']);

      // Move forward to t=400
      fakeTimers.runTimersToTime(200);
      expect(runOrder).toEqual(['mock2', 'mock3', 'mock1', 'mock4', 'mock4']);
    });

    it('does nothing when no timers have been scheduled', () => {
      const global = {};
      const fakeTimers = new FakeTimers(global);

      fakeTimers.runTimersToTime(100);
    });

    it('throws before allowing infinite recursion', () => {
      const global = {};
      const fakeTimers = new FakeTimers(global, 100);

      global.setTimeout(function infinitelyRecursingCallback() {
        global.setTimeout(infinitelyRecursingCallback, 0);
      }, 0);

      expect(() => {
        fakeTimers.runTimersToTime(50);
      }).toThrow(new Error(
        'Ran 100 timers, and there are still more! Assuming we\'ve hit an ' +
        'infinite recursion and bailing out...'
      ));
    });
  });

  describe('reset', () => {
    it('resets all pending setTimeouts', () => {
      const global = {};
      const fakeTimers = new FakeTimers(global);

      const mock1 = jest.genMockFn();
      global.setTimeout(mock1, 100);

      fakeTimers.reset();
      fakeTimers.runAllTimers();
      expect(mock1.mock.calls.length).toBe(0);
    });

    it('resets all pending setIntervals', () => {
      const global = {};
      const fakeTimers = new FakeTimers(global);

      const mock1 = jest.genMockFn();
      global.setInterval(mock1, 200);

      fakeTimers.reset();
      fakeTimers.runAllTimers();
      expect(mock1.mock.calls.length).toBe(0);
    });

    it('resets all pending ticks callbacks & immediates', () => {
      const global = {
        setImmediate: () => {},
        process: {
          nextTick: () => {},
        },
      };
      const fakeTimers = new FakeTimers(global);

      const mock1 = jest.genMockFn();
      global.process.nextTick(mock1);
      global.setImmediate(mock1);

      fakeTimers.reset();
      fakeTimers.runAllTicks();
      fakeTimers.runAllImmediates();
      expect(mock1.mock.calls.length).toBe(0);
    });

    it('resets current runTimersToTime time cursor', () => {
      const global = {};
      const fakeTimers = new FakeTimers(global);

      const mock1 = jest.genMockFn();
      global.setTimeout(mock1, 100);
      fakeTimers.runTimersToTime(50);

      fakeTimers.reset();
      global.setTimeout(mock1, 100);

      fakeTimers.runTimersToTime(50);
      expect(mock1.mock.calls.length).toBe(0);
    });
  });

  describe('runOnlyPendingTimers', () => {
    it('runs all timers in order', () => {
      const nativeSetImmediate = jest.genMockFn();

      const global = {
        setImmediate: nativeSetImmediate,
      };

      const fakeTimers = new FakeTimers(global);

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

      fakeTimers.runOnlyPendingTimers();
      expect(runOrder).toEqual([
        'mock4',
        'mock2',
        'mock1',
        'mock3',
      ]);

      fakeTimers.runOnlyPendingTimers();
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
      const global = {};
      const fakeTimers = new FakeTimers(global);

      const fn = jest.genMockFn();
      const timer = global.setTimeout(fn, 10);
      global.setTimeout(() => {
        global.clearTimeout(timer);
      }, 0);

      fakeTimers.runOnlyPendingTimers();
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
        setInterval: nativeSetInterval,
        setTimeout: nativeSetTimeout,
      };
      const fakeTimers = new FakeTimers(global);

      // clearInterval()
      fakeTimers.runWithRealTimers(() => {
        global.clearInterval();
      });
      expect(nativeClearInterval.mock.calls.length).toBe(1);
      expect(global.clearInterval.mock.calls.length).toBe(0);

      // clearTimeout()
      fakeTimers.runWithRealTimers(() => {
        global.clearTimeout();
      });
      expect(nativeClearTimeout.mock.calls.length).toBe(1);
      expect(global.clearTimeout.mock.calls.length).toBe(0);

      // setInterval()
      fakeTimers.runWithRealTimers(() => {
        global.setInterval();
      });
      expect(nativeSetInterval.mock.calls.length).toBe(1);
      expect(global.setInterval.mock.calls.length).toBe(0);

      // setTimeout()
      fakeTimers.runWithRealTimers(() => {
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
        setInterval: nativeSetInterval,
        setTimeout: nativeSetTimeout,
      };
      const fakeTimers = new FakeTimers(global);

      // clearInterval()
      fakeTimers.runWithRealTimers(() => {
        global.clearInterval();
      });
      expect(nativeClearInterval.mock.calls.length).toBe(1);
      expect(global.clearInterval.mock.calls.length).toBe(0);

      global.clearInterval();
      expect(nativeClearInterval.mock.calls.length).toBe(1);
      expect(global.clearInterval.mock.calls.length).toBe(1);

      // clearTimeout()
      fakeTimers.runWithRealTimers(() => {
        global.clearTimeout();
      });
      expect(nativeClearTimeout.mock.calls.length).toBe(1);
      expect(global.clearTimeout.mock.calls.length).toBe(0);

      global.clearTimeout();
      expect(nativeClearTimeout.mock.calls.length).toBe(1);
      expect(global.clearTimeout.mock.calls.length).toBe(1);

      // setInterval()
      fakeTimers.runWithRealTimers(() => {
        global.setInterval();
      });
      expect(nativeSetInterval.mock.calls.length).toBe(1);
      expect(global.setInterval.mock.calls.length).toBe(0);

      global.setInterval();
      expect(nativeSetInterval.mock.calls.length).toBe(1);
      expect(global.setInterval.mock.calls.length).toBe(1);

      // setTimeout()
      fakeTimers.runWithRealTimers(() => {
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
      const global = {setTimeout: nativeSetTimeout};
      const fakeTimers = new FakeTimers(global);

      expect(() => {
        fakeTimers.runWithRealTimers(() => {
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
        setTimeout: nativeSetTimeout,
        setInterval: nativeSetInterval,
        clearTimeout: nativeClearTimeout,
        clearInterval: nativeClearInterval,
      };
      const fakeTimers = new FakeTimers(global);

      // Ensure that fakeTimers has overridden the native timer APIs
      // (because if it didn't, this test might pass when it shouldn't)
      expect(global.setTimeout).not.toBe(nativeSetTimeout);
      expect(global.setInterval).not.toBe(nativeSetInterval);
      expect(global.clearTimeout).not.toBe(nativeClearTimeout);
      expect(global.clearInterval).not.toBe(nativeClearInterval);

      fakeTimers.useRealTimers();

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
      const fakeTimers = new FakeTimers(global);

      // Ensure that fakeTimers has overridden the native timer APIs
      // (because if it didn't, this test might pass when it shouldn't)
      expect(global.process.nextTick).not.toBe(nativeProcessNextTick);

      fakeTimers.useRealTimers();

      expect(global.process.nextTick).toBe(nativeProcessNextTick);
    });

    it('resets native setImmediate when present', () => {
      const nativeSetImmediate = jest.genMockFn();
      const nativeClearImmediate = jest.genMockFn();

      const global = {
        setImmediate: nativeSetImmediate,
        clearImmediate: nativeClearImmediate,
      };
      const fakeTimers = new FakeTimers(global);

      // Ensure that fakeTimers has overridden the native timer APIs
      // (because if it didn't, this test might pass when it shouldn't)
      expect(global.setImmediate).not.toBe(nativeSetImmediate);
      expect(global.clearImmediate).not.toBe(nativeClearImmediate);

      fakeTimers.useRealTimers();

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
        setTimeout: nativeSetTimeout,
        setInterval: nativeSetInterval,
        clearTimeout: nativeClearTimeout,
        clearInterval: nativeClearInterval,
      };
      const fakeTimers = new FakeTimers(global);
      fakeTimers.useRealTimers();

      // Ensure that the real timers are installed at this point
      // (because if they aren't, this test might pass when it shouldn't)
      expect(global.setTimeout).toBe(nativeSetTimeout);
      expect(global.setInterval).toBe(nativeSetInterval);
      expect(global.clearTimeout).toBe(nativeClearTimeout);
      expect(global.clearInterval).toBe(nativeClearInterval);

      fakeTimers.useFakeTimers();

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
      const fakeTimers = new FakeTimers(global);
      fakeTimers.useRealTimers();

      // Ensure that the real timers are installed at this point
      // (because if they aren't, this test might pass when it shouldn't)
      expect(global.process.nextTick).toBe(nativeProcessNextTick);

      fakeTimers.useFakeTimers();

      expect(global.process.nextTick).not.toBe(nativeProcessNextTick);
    });

    it('resets mock setImmediate when present', () => {
      const nativeSetImmediate = jest.genMockFn();
      const nativeClearImmediate = jest.genMockFn();

      const global = {
        setImmediate: nativeSetImmediate,
        clearImmediate: nativeClearImmediate,
      };
      const fakeTimers = new FakeTimers(global);
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
