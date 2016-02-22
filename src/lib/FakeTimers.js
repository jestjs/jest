/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const mocks = require('./moduleMocker');

const MS_IN_A_YEAR = 31536000000;

class FakeTimers {

  constructor(global, maxLoops) {
    this._global = global;
    this._uuidCounter = 1;
    this._maxLoops = maxLoops || 100000;

    this.reset();

    // Store original timer APIs for future reference
    this._originalTimerAPIs = {
      setTimeout: global.setTimeout,
      clearTimeout: global.clearTimeout,
      setInterval: global.setInterval,
      clearInterval: global.clearInterval,
    };

    this._fakeTimerAPIs = {
      setTimeout: mocks.getMockFn().mockImpl(
        this._fakeSetTimeout.bind(this)
      ),
      clearTimeout: mocks.getMockFn().mockImpl(
        this._fakeClearTimer.bind(this)
      ),
      setInterval: mocks.getMockFn().mockImpl(
        this._fakeSetInterval.bind(this)
      ),
      clearInterval: mocks.getMockFn().mockImpl(
        this._fakeClearTimer.bind(this)
      ),
    };

    // If there's a process.nextTick on the global, mock it out
    // (only applicable to node/node-emulating environments)
    if (typeof global.process === 'object'
        && typeof global.process.nextTick === 'function') {
      this._originalTimerAPIs.nextTick = global.process.nextTick;
      this._fakeTimerAPIs.nextTick = mocks.getMockFn().mockImpl(
        this._fakeNextTick.bind(this)
      );
    }

    // If there's a global.setImmediate, mock it out
    if (typeof global.setImmediate === 'function') {
      this._originalTimerAPIs.setImmediate = global.setImmediate;
      this._fakeTimerAPIs.setImmediate = mocks.getMockFn().mockImpl(
          this._fakeSetImmediate.bind(this)
      );
      this._originalTimerAPIs.clearImmediate = global.clearImmediate;
      this._fakeTimerAPIs.clearImmediate = mocks.getMockFn().mockImpl(
        this._fakeClearImmediate.bind(this)
      );
    }

    this.useFakeTimers();

    // These globally-accessible function are now deprecated!
    // They will go away very soon, so do not use them!
    // Instead, use the versions available on the `jest` object
    global.mockRunTicksRepeatedly = this.runAllTicks.bind(this);
    global.mockRunTimersOnce = this.runOnlyPendingTimers.bind(this);
    global.mockRunTimersToTime = this.runTimersToTime.bind(this);
    global.mockRunTimersRepeatedly = this.runAllTimers.bind(this);
    global.mockClearTimers = this.clearAllTimers.bind(this);
    global.mockGetTimersCount = () => Object.keys(this._timers).length;
  }

  clearAllTimers() {
    this._immediates.forEach(function(immediate) {
      this._fakeClearImmediate(immediate.uuid);
    }, this);
    for (const uuid in this._timers) {
      delete this._timers[uuid];
    }
  }

  reset() {
    this._cancelledTicks = {};
    this._cancelledImmediates = {};
    this._now = 0;
    this._ticks = [];
    this._immediates = [];
    this._timers = {};
  }

  // Used to be called runTicksRepeatedly
  runAllTicks() {
    // Only run a generous number of ticks and then bail.
    // This is just to help avoid recursive loops
    let i;
    for (i = 0; i < this._maxLoops; i++) {
      const tick = this._ticks.shift();

      if (tick === undefined) {
        break;
      }

      if (!this._cancelledTicks.hasOwnProperty(tick.uuid)) {
        // Callback may throw, so update the map prior calling.
        this._cancelledTicks[tick.uuid] = true;
        tick.callback();
      }
    }

    if (i === this._maxLoops) {
      throw new Error(
        'Ran ' + this._maxLoops + ' ticks, and there are still more! ' +
        'Assuming we\'ve hit an infinite recursion and bailing out...'
      );
    }
  }

  runAllImmediates() {
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
        'Ran ' + this._maxLoops +
        ' immediates, and there are still more! Assuming ' +
        'we\'ve hit an infinite recursion and bailing out...'
      );
    }
  }

  _runImmediate(immediate) {
    if (!this._cancelledImmediates.hasOwnProperty(immediate.uuid)) {
      // Callback may throw, so update the map prior calling.
      this._cancelledImmediates[immediate.uuid] = true;
      immediate.callback();
    }
  }

  // Used to be called runTimersRepeatedly
  runAllTimers() {
    this.runAllTicks();
    this.runAllImmediates();

    // Only run a generous number of timers and then bail.
    // This is just to help avoid recursive loops
    let i;
    for (i = 0; i < this._maxLoops; i++) {
      const nextTimerHandle = this._getNextTimerHandle();

      // If there are no more timer handles, stop!
      if (nextTimerHandle === null) {
        break;
      }

      this._runTimerHandle(nextTimerHandle);

      // Some of the immediate calls could be enqueued
      // during the previous handling of the timers, we should
      // run them as well.
      if (this._immediates.length) {
        this.runAllImmediates();
      }
    }

    if (i === this._maxLoops) {
      throw new Error(
        'Ran ' + this._maxLoops + ' timers, and there are still more! ' +
        'Assuming we\'ve hit an infinite recursion and bailing out...'
      );
    }
  }

  // Used to be called runTimersOnce
  runOnlyPendingTimers() {
    this._immediates.forEach(this._runImmediate, this);
    const timers = this._timers;
    Object.keys(timers)
      .sort(function(left, right) {
        return timers[left].expiry - timers[right].expiry;
      })
      .forEach(this._runTimerHandle, this);
  }

  // Use to be runTimersToTime
  runTimersToTime(msToRun) {
    // Only run a generous number of timers and then bail.
    // This is jsut to help avoid recursive loops
    let i;
    for (i = 0; i < this._maxLoops; i++) {
      const timerHandle = this._getNextTimerHandle();

      // If there are no more timer handles, stop!
      if (timerHandle === null) {
        break;
      }

      const nextTimerExpiry = this._timers[timerHandle].expiry;
      if (this._now + msToRun < nextTimerExpiry) {
        // There are no timers between now and the target we're running to, so
        // adjust our time cursor and quit
        this._now += msToRun;
        break;
      } else {
        msToRun -= (nextTimerExpiry - this._now);
        this._now = nextTimerExpiry;
        this._runTimerHandle(timerHandle);
      }
    }

    if (i === this._maxLoops) {
      throw new Error(
        'Ran ' + this._maxLoops + ' timers, and there are still more! ' +
        'Assuming we\'ve hit an infinite recursion and bailing out...'
      );
    }
  }

  runWithRealTimers(cb) {
    const hasNextTick =
      typeof this._global.process === 'object'
      && typeof this._global.process.nextTick === 'function';

    const hasSetImmediate = typeof this._global.setImmediate === 'function';

    const prevSetTimeout = this._global.setTimeout;
    const prevSetInterval = this._global.setInterval;
    const prevClearTimeout = this._global.clearTimeout;
    const prevClearInterval = this._global.clearInterval;

    let prevNextTick;
    let prevSetImmediate;
    let prevClearImmediate;

    if (hasNextTick) {
      prevNextTick = this._global.process.nextTick;
    }
    if (hasSetImmediate) {
      prevSetImmediate = this._global.setImmediate;
      prevClearImmediate = this._global.clearImmediate;
    }

    this.useRealTimers();

    let cbErr = null;
    let errThrown = false;
    try {
      cb();
    } catch (e) {
      errThrown = true;
      cbErr = e;
    }

    this._global.setTimeout = prevSetTimeout;
    this._global.setInterval = prevSetInterval;
    this._global.clearTimeout = prevClearTimeout;
    this._global.clearInterval = prevClearInterval;
    if (hasNextTick) {
      this._global.process.nextTick = prevNextTick;
    }
    if (hasSetImmediate) {
      this._global.setImmediate = prevSetImmediate;
      this._global.clearImmediate = prevClearImmediate;
    }

    if (errThrown) {
      throw cbErr;
    }
  }

  useRealTimers() {
    const hasNextTick =
      typeof this._global.process === 'object'
      && typeof this._global.process.nextTick === 'function';

    const hasSetImmediate = typeof this._global.setImmediate === 'function';

    this._global.setTimeout = this._originalTimerAPIs.setTimeout;
    this._global.setInterval = this._originalTimerAPIs.setInterval;
    this._global.clearTimeout = this._originalTimerAPIs.clearTimeout;
    this._global.clearInterval = this._originalTimerAPIs.clearInterval;
    if (hasNextTick) {
      this._global.process.nextTick = this._originalTimerAPIs.nextTick;
    }
    if (hasSetImmediate) {
      this._global.setImmediate = this._originalTimerAPIs.setImmediate;
      this._global.clearImmediate = this._originalTimerAPIs.clearImmediate;
    }
  }

  useFakeTimers() {
    const hasNextTick =
      typeof this._global.process === 'object'
      && typeof this._global.process.nextTick === 'function';

    const hasSetImmediate = typeof this._global.setImmediate === 'function';

    this._global.setTimeout = this._fakeTimerAPIs.setTimeout;
    this._global.setInterval = this._fakeTimerAPIs.setInterval;
    this._global.clearTimeout = this._fakeTimerAPIs.clearTimeout;
    this._global.clearInterval = this._fakeTimerAPIs.clearInterval;
    if (hasNextTick) {
      this._global.process.nextTick = this._fakeTimerAPIs.nextTick;
    }
    if (hasSetImmediate) {
      this._global.setImmediate = this._fakeTimerAPIs.setImmediate;
      this._global.clearImmediate = this._fakeTimerAPIs.clearImmediate;
    }
  }

  _fakeClearTimer(uuid) {
    if (this._timers.hasOwnProperty(uuid)) {
      delete this._timers[uuid];
    }
  }

  _fakeClearImmediate(uuid) {
    this._cancelledImmediates[uuid] = true;
  }

  _fakeNextTick(callback) {
    const args = [];
    for (let ii = 1, ll = arguments.length; ii < ll; ii++) {
      args.push(arguments[ii]);
    }

    const uuid = this._uuidCounter++;

    this._ticks.push({
      uuid,
      callback: function() {
        return callback.apply(null, args);
      },
    });

    const cancelledTicks = this._cancelledTicks;
    this._originalTimerAPIs.nextTick(function() {
      if (!cancelledTicks.hasOwnProperty(uuid)) {
        // Callback may throw, so update the map prior calling.
        cancelledTicks[uuid] = true;
        callback.apply(null, args);
      }
    });
  }

  _fakeSetImmediate(callback) {
    const args = [];
    for (let ii = 1, ll = arguments.length; ii < ll; ii++) {
      args.push(arguments[ii]);
    }

    const uuid = this._uuidCounter++;

    this._immediates.push({
      uuid,
      callback: function() {
        return callback.apply(null, args);
      },
    });

    const cancelledImmediates = this._cancelledImmediates;
    this._originalTimerAPIs.setImmediate(function() {
      if (!cancelledImmediates.hasOwnProperty(uuid)) {
        // Callback may throw, so update the map prior calling.
        cancelledImmediates[uuid] = true;
        callback.apply(null, args);
      }
    });

    return uuid;
  }

  _fakeSetInterval(callback, intervalDelay) {
    if (intervalDelay === undefined || intervalDelay === null) {
      intervalDelay = 0;
    }

    const args = [];
    for (let ii = 2, ll = arguments.length; ii < ll; ii++) {
      args.push(arguments[ii]);
    }

    const uuid = this._uuidCounter++;

    this._timers[uuid] = {
      type: 'interval',
      callback: function() {
        return callback.apply(null, args);
      },
      expiry: this._now + intervalDelay,
      interval: intervalDelay,
    };

    return uuid;
  }

  _fakeSetTimeout(callback, delay)  {
    if (delay === undefined || delay === null) {
      delay = 0;
    }

    const args = [];
    for (let ii = 2, ll = arguments.length; ii < ll; ii++) {
      args.push(arguments[ii]);
    }

    const uuid = this._uuidCounter++;

    this._timers[uuid] = {
      type: 'timeout',
      callback: function() {
        return callback.apply(null, args);
      },
      expiry: this._now + delay,
      interval: null,
    };

    return uuid;
  }

  _getNextTimerHandle() {
    let nextTimerHandle = null;
    let uuid;
    let soonestTime = MS_IN_A_YEAR;
    let timer;
    for (uuid in this._timers) {
      timer = this._timers[uuid];
      if (timer.expiry < soonestTime) {
        soonestTime = timer.expiry;
        nextTimerHandle = uuid;
      }
    }

    return nextTimerHandle;
  }

  _runTimerHandle(timerHandle) {
    const timer = this._timers[timerHandle];

    if (!timer) {
      return;
    }

    switch (timer.type) {
      case 'timeout':
        const callback = timer.callback;
        delete this._timers[timerHandle];
        callback();
        break;

      case 'interval':
        timer.expiry = this._now + timer.interval;
        timer.callback();
        break;

      default:
        throw new Error('Unexpected timer type: ' + timer.type);
    }
  }

}

module.exports = FakeTimers;
