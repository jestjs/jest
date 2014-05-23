/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var mocks = require('./moduleMocker');

var MS_IN_A_YEAR = 31536000000;

function FakeTimers(global, maxLoops) {
  this._global = global;
  this._uuidCounter = 1;
  this._maxLoops = maxLoops || 100000;

  this.reset();

  // Store original timer APIs for future reference
  this._originalTimerAPIs = {
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    setInterval: global.setInterval,
    clearInterval: global.clearInterval
  };

  // Install mocked versions of the timer APIs
  global.setTimeout = mocks.getMockFn().mockImpl(
    this._fakeSetTimeout.bind(this)
  );
  global.clearTimeout = mocks.getMockFn().mockImpl(
    this._fakeClearTimer.bind(this)
  );
  global.setInterval = mocks.getMockFn().mockImpl(
    this._fakeSetInterval.bind(this)
  );
  global.clearInterval = mocks.getMockFn().mockImpl(
    this._fakeClearTimer.bind(this)
  );

  // If there's a process.nextTick on the global, mock it out
  // (only applicable to node/node-emulating environments)
  if (typeof global.process === 'object'
      && typeof global.process.nextTick === 'function') {
    this._originalTimerAPIs.nextTick = global.process.nextTick;
    global.process.nextTick = mocks.getMockFn().mockImpl(
      this._fakeNextTick.bind(this)
    );
  }

  // TODO: These globally-accessible function are now deprecated!
  //       They will go away very soon, so do not use them!
  //       Instead, use the versions available on the `jest` object
  global.mockRunTicksRepeatedly = this.runAllTicks.bind(this);
  global.mockRunTimersOnce = this.runOnlyPendingTimers.bind(this);
  global.mockRunTimersToTime = this.runTimersToTime.bind(this);
  global.mockRunTimersRepeatedly = this.runAllTimers.bind(this);
  global.mockClearTimers = this.clearAllTimers.bind(this);
  global.mockGetTimersCount = function() {
    return Object.keys(this._timers).length;
  }.bind(this);
}

FakeTimers.prototype.clearAllTimers = function() {
  for (var uuid in this._timers) {
    delete this._timers[uuid];
  }
};

FakeTimers.prototype.reset = function() {
  this._cancelledTicks = {};
  this._now = 0;
  this._ticks = [];
  this._timers = {};
};

// Used to be called runTicksRepeatedly
FakeTimers.prototype.runAllTicks = function() {
  // Only run a generous number of ticks and then bail.
  // This is just to help avoid recursive loops

  for (var i = 0; i < this._maxLoops; i++) {
    var tick = this._ticks.shift();

    if (tick === undefined) {
      break;
    }

    if (!this._cancelledTicks.hasOwnProperty(tick.uuid)) {
      tick.callback();
      this._cancelledTicks[tick.uuid] = true;
    }
  }

  if (i === this._maxLoops) {
    throw new Error(
      'Ran ' + this._maxLoops + ' ticks, and there are still more! Assuming ' +
      'we\'ve hit an infinite recursion and bailing out...'
    );
  }
};

// Used to be called runTimersRepeatedly
FakeTimers.prototype.runAllTimers = function() {
  this.runAllTicks();

  // Only run a generous number of timers and then bail.
  // This is just to help avoid recursive loops

  for (var i = 0; i < this._maxLoops; i++) {
    var nextTimerHandle = this._getNextTimerHandle();

    // If there are no more timer handles, stop!
    if (nextTimerHandle === null) {
      break;
    }

    this._runTimerHandle(nextTimerHandle);
  }

  if (i === this._maxLoops) {
    throw new Error(
      'Ran ' + this._maxLoops + ' timers, and there are still more! Assuming ' +
      'we\'ve hit an infinite recursion and bailing out...'
    );
  }
};

// Used to be called runTimersOnce
FakeTimers.prototype.runOnlyPendingTimers = function() {
  var timers = this._timers;
  Object.keys(timers)
    .sort(function(left, right) {
      return timers[left].expiry - timers[right].expiry;
    })
    .forEach(this._runTimerHandle, this);
};

// Use to be runTimersToTime
FakeTimers.prototype.runTimersToTime = function(msToRun) {
  // Only run a generous number of timers and then bail.
  // This is jsut to help avoid recursive loops

  for (var i = 0; i < this._maxLoops; i++) {
    var timerHandle = this._getNextTimerHandle();

    // If there are no more timer handles, stop!
    if (timerHandle === null) {
      break;
    }

    var nextTimerExpiry = this._timers[timerHandle].expiry;
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
      'Ran ' + this._maxLoops + ' timers, and there are still more! Assuming ' +
      'we\'ve hit an infinite recursion and bailing out...'
    );
  }
};

FakeTimers.prototype.runWithRealTimers = function(cb) {
  var hasNextTick =
    typeof this._global.process === 'object'
    && typeof this._global.process.nextTick === 'function';

  var fakeSetTimeout = this._global.setTimeout;
  var fakeSetInterval = this._global.setInterval;
  var fakeClearTimeout = this._global.clearTimeout;
  var fakeClearInterval = this._global.clearInterval;
  if (hasNextTick) {
    var fakeNextTick = this._global.process.nextTick;
  }

  this._global.setTimeout = this._originalTimerAPIs.setTimeout;
  this._global.setInterval = this._originalTimerAPIs.setInterval;
  this._global.clearTimeout = this._originalTimerAPIs.clearTimeout;
  this._global.clearInterval = this._originalTimerAPIs.clearInterval;
  if (hasNextTick) {
    this._global.process.nextTick = this._originalTimerAPIs.nextTick;
  }

  var cbErr = null;
  var errThrown = false;
  try {
    cb();
  } catch (e) {
    errThrown = true;
    cbErr = e;
  }

  this._global.setTimeout = fakeSetTimeout;
  this._global.setInterval = fakeSetInterval;
  this._global.clearTimeout = fakeClearTimeout;
  this._global.clearInterval = fakeClearInterval;
  if (hasNextTick) {
    this._global.process.nextTick = fakeNextTick;
  }

  if (errThrown) {
    throw cbErr;
  }
};

FakeTimers.prototype._fakeClearTimer = function(uuid) {
  if (this._timers.hasOwnProperty(uuid)) {
    delete this._timers[uuid];
  }
};

FakeTimers.prototype._fakeNextTick = function(callback) {
  var uuid = this._uuidCounter++;
  this._ticks.push({
    uuid: uuid,
    callback: callback
  });

  var cancelledTicks = this._cancelledTicks;
  this._originalTimerAPIs.nextTick(function() {
    if (!cancelledTicks.hasOwnProperty(uuid)) {
      callback();
      cancelledTicks[uuid] = true;
    }
  });
};

FakeTimers.prototype._fakeSetInterval = function(callback, intervalDelay) {
  if (intervalDelay === undefined || intervalDelay === null) {
    intervalDelay = 0;
  }

  var uuid = this._uuidCounter++;

  this._timers[uuid] = {
    type: 'interval',
    callback: callback,
    expiry: this._now + intervalDelay,
    interval: intervalDelay
  };

  return uuid;
};

FakeTimers.prototype._fakeSetTimeout = function(callback, delay)  {
  if (delay === undefined || delay === null) {
    delay = 0;
  }

  var uuid = this._uuidCounter++;

  this._timers[uuid] = {
    type: 'timeout',
    callback: callback,
    expiry: this._now + delay,
    interval: null
  };

  return uuid;
};

FakeTimers.prototype._getNextTimerHandle = function() {
  var nextTimerHandle = null;
  var uuid;
  var soonestTime = MS_IN_A_YEAR;

  var timer;
  for (uuid in this._timers) {
    timer = this._timers[uuid];
    if (timer.expiry < soonestTime) {
      soonestTime = timer.expiry;
      nextTimerHandle = uuid;
    }
  }

  return nextTimerHandle;
};

FakeTimers.prototype._runTimerHandle = function(timerHandle) {
  var timer = this._timers[timerHandle];

  switch (timer.type) {
    case 'timeout':
      var callback = timer.callback;
      delete this._timers[timerHandle];
      callback();
      break;

    case 'interval':
      timer.expiry = this._now + timer.interval;
      timer.callback();
      break;

    default:
      throw new Error('Unexepcted timer type: ' + timer.type);
  }
};

module.exports = FakeTimers;
