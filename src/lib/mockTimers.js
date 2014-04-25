'use strict';

var mocks = require('./moduleMocker');

var now;
var timers;
var ticks = [];
var cancelledTicks = {};
function reset() {
  timers = {};
  ticks = [];
  cancelledTicks = {};
  // Keep a fake timestamp
  // move on the time when runTimersToTime() is called
  now = 0;
}

reset();

// add a timer of type either 'timeout' or 'interval'
function _setTimer(type, callback, delay) {
  if (delay === null || delay === undefined) {
    delay = 0;
  }
  var token = null;
  do {
    token = Math.floor(Math.random() * 4294967296) + 1;
  } while (timers[token]);
  timers[token] = {
    type: type,
    callback: callback,
    time: now + delay,
    interval: (type === 'interval' ? delay : 0)
  };
  return token;
}

// clear a timer of type either 'timeout' or 'interval'
function _clearTimer(type, token) {
  if (timers[token] && timers[token].type === type) {
    delete timers[token];
  }
}

function _setTimeout(callback, delay) {
  return _setTimer('timeout', callback, delay);
}

function _setInterval(callback, delay) {
  return _setTimer('interval', callback, delay);
}

function _clearTimeout(token) {
  _clearTimer('timeout', token);
}

function _clearInterval(token) {
  _clearTimer('interval', token);
}

// Run timer of given token
function _runTimer(token) {
  // Skip non-existing token
  if (timers[token]) {
    if (timers[token].type === 'timeout') {
      // for 'timeout', run callback and delete the timer
      var callback = timers[token].callback;
      delete timers[token];
      callback();
    } else if (timers[token].type === 'interval') {
      // for 'interval', run callback and set the next invoke time
      timers[token].time =
        now + timers[token].interval;
      timers[token].callback();
    }
  }
}

function _runTimersOnce() {
  // Invoke all timers once regardsless of the delay
  for (var token in timers) {
    _runTimer(token);
  }
}

function _runTimersToTime(delay) {
  var toRunToken = _getNextTimerToken();
  if (!toRunToken) {
    return;
  }

  var minTime = timers[toRunToken].time;
  if (now + delay < minTime) {
    // Termination when there's no more timers to invoke
    now += delay;
  } else {
    // Recursively invoke the next to-run timer
    delay -= (minTime - now);
    now = minTime;
    _runTimer(toRunToken);
    _runTimersToTime(delay);
  }
}

var originalNextTick = process.nextTick.bind(process);
function _nextTick(callback) {
  var tickCancellationID = ticks.length;
  ticks.push(callback);

  originalNextTick(function() {
    if (!cancelledTicks[tickCancellationID]) {
      callback();
    }
  });
}

function _runTicksRepeatedly() {
  for (var i = 0; i < ticks.length; i++) {
    ticks[i]();
    cancelledTicks[i] = true;
  }
}

function _runTimersRepeatedly() {
  _runTicksRepeatedly();

  // Only run a generous 1000 timers and then bail, since we may have entered
  // a loop if we have more than that.
  var maxTimers = 1000;

  var token;
  for (var ii = 0; ii < maxTimers; ii++) {
    token = _getNextTimerToken();

    if (!token) {
      break;
    }

    _runTimer(token);
  }

  if (ii === maxTimers) {
    throw new Error('More timers still exist after ' + maxTimers + ' timers!');
  }
}

function _clearTimers() {
  for (var token in timers) {
    delete timers[token];
  }
}

function _getNextTimerToken() {
  var nextTimerToken = null;
  var minTime = 31536000000; // One year
  // Find the next to invoke timer
  for (var token in timers) {
    if (timers[token].time < minTime) {
      nextTimerToken = token;
      minTime = timers[token].time;
    }
  }
  return nextTimerToken;
}

var mockTimers = {
  setTimeout: _setTimeout,
  clearTimeout: _clearTimeout,
  setInterval: _setInterval,
  clearInterval: _clearInterval,
  nextTick: _nextTick,

  /**
   * Iteratively run nextTick() callbacks until there are no callbacks left to
   * call.
   */
  runTicksRepeatedly: _runTicksRepeatedly,

  /**
   * Iteratively run callbacks in time order during the time from now to
   * now + delay.
   * If one callback register another timer which should be run during now to
   * now + delay, the new timer will also be run in the right order.
   *
   * @param delay
   */
  runTimersToTime: _runTimersToTime,

  /**
   * Run all registered timer once. Newly registered timers will not be run.
   */
  runTimersOnce: _runTimersOnce,

  /**
   * Iteratively run callbacks until there are no timers left to call. Will
   * stop after a maximum number of iterations to avoid infinite loop.
   */
  runTimersRepeatedly: _runTimersRepeatedly,

  /**
   * Clear all timers
   */
  clearTimers: _clearTimers,

  /**
   * Get the number of remaining timers
   */
  getTimersCount: function() {
    return Object.keys(timers).length;
  }
};

module.exports.reset = reset;

module.exports.installMockTimers = function(window) {
  window._originalTimeouts = {
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    setInterval: window.setInterval,
    clearInterval: window.clearInterval,
    nextTick: process.nextTick
  };
  window.setTimeout =
    mocks.getMockFunction().mockImplementation(mockTimers.setTimeout);
  window.clearTimeout =
    mocks.getMockFunction().mockImplementation(mockTimers.clearTimeout);
  window.setInterval =
    mocks.getMockFunction().mockImplementation(mockTimers.setInterval);
  window.clearInterval =
    mocks.getMockFunction().mockImplementation(mockTimers.clearInterval);
  window.mockRunTicksRepeatedly =
    mocks.getMockFunction().mockImplementation(mockTimers.runTicksRepeatedly);
  window.mockRunTimersOnce =
    mocks.getMockFunction().mockImplementation(mockTimers.runTimersOnce);
  window.mockRunTimersToTime =
    mocks.getMockFunction().mockImplementation(mockTimers.runTimersToTime);
  window.mockRunTimersRepeatedly =
    mocks.getMockFunction().mockImplementation(mockTimers.runTimersRepeatedly);
  window.mockClearTimers =
    mocks.getMockFunction().mockImplementation(mockTimers.clearTimers);
  window.mockGetTimersCount =
    mocks.getMockFunction().mockImplementation(mockTimers.getTimersCount);

  if (typeof process === 'object' && typeof process.nextTick === 'function') {
    window.process = Object.create(process);
    window.process.nextTick =
      mocks.getMockFunction().mockImplementation(mockTimers.nextTick);
  }
};

module.exports.uninstallMockTimers = function(window) {
  window.setTimeout = window._originalTimeouts.setTimeout;
  window.clearTimeout = window._originalTimeouts.clearTimeout;
  window.setInterval = window._originalTimeouts.setInterval;
  window.clearInterval = window._originalTimeouts.clearInterval;
  window.process.nextTick = window._originalTimeouts.nextTick;

  window._originalTimeouts = undefined;
  window.mockRunTicksRepeatedly = undefined;
  window.mockRunTimersOnce = undefined;
  window.mockRunTimersToTime = undefined;
  window.mockRunTimersRepeatedly = undefined;
  window.mockClearTimers = undefined;
  window.mockGetTimersCount = undefined;
};
