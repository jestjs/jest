---
id: timer-mocks
title: Timer mocks
layout: docs
category: Reference
permalink: docs/timer-mocks.html
next: api
---

The native timer functions (i.e., `setTimeout`, `setInterval`, `clearTimeout`,
`clearInterval`) are less than ideal for a testing environment since they depend
on real time to elapse. To resolve this issue, Jest provides you with mocked
timer functions and APIs that allow you to control the passage of time.
[Great Scott!](https://www.youtube.com/watch?v=5gVv10J4nio)

```javascript
// timerGame.js
function timerGame(callback) {
  console.log('Ready....go!');

  setTimeout(function() {
    console.log("Time's up -- stop!");
    callback && callback();
  }, 1000);
}

module.exports = timerGame;
```
```javascript
// __tests__/timerGame-test.js
jest.dontMock('../timerGame');

describe('timerGame', function() {
  it('waits 1 second before ending the game', function() {
    var timerGame = require('../timerGame');
    timerGame();

    expect(setTimeout.mock.calls.length).toBe(1);
    expect(setTimeout.mock.calls[0][1]).toBe(1000);
  });
});
```

## Run All Timers

Another test we might want to write for this module is one that asserts that the
callback is called after 1 second. To do this, we're going to use Jest's timer
control APIs to fast-forward time right in the middle of the test:

```javascript
  it('calls the callback after 1 second', function() {
    var timerGame = require('../timerGame');
    var callback = jest.genMockFunction();

    timerGame(callback);

    // At this point in time, the callback should not have been called yet
    expect(callback).not.toBeCalled();

    // Fast-forward until all timers have been executed
    jest.runAllTimers();

    // Now our callback should have been called!
    expect(callback).toBeCalled()
    expect(callback.mock.calls.length).toBe(1);
  });
```

## Run Pending Timers

There are also scenarios where you might have a recursive timer -- that is a
timer that sets a new timer in its own callback. For these, running all the
timers would be an endless loop… so something like `jest.runAllTimers()` is not
desirable. For these cases you might use `jest.runOnlyPendingTimers()`:

```javascript
// infiniteTimerGame.js
function infiniteTimerGame(callback) {
  console.log('Ready....go!');

  setTimeout(function() {
    console.log('Times up! 10 seconds before the next game starts...');
    callback && callback();

    // Schedule the next game in 10 seconds
    setTimeout(function() {
      infiniteTimerGame(callback);
    }, 10000);

  }, 1000);
}

module.exports = infiniteTimerGame;
```
```javascript
// __tests__/infiniteTimerGame-test.js
jest.dontMock('../infiniteTimerGame');

describe('infiniteTimerGame', function() {
  it('schedules a 10-second timer after 1 second', function() {
    var infiniteTimerGame = require('../infiniteTimerGame');
    var callback = jest.genMockFunction();

    infiniteTimerGame(callback);

    // At this point in time, there should have been a single call to
    // setTimeout to schedule the end of the game in 1 second.
    expect(setTimeout.mock.calls.length).toBe(1);
    expect(setTimeout.mock.calls[0][1]).toBe(1000);

    // Fast forward and exhaust only currently pending timers
    // (but not any new timers that get created during that process)
    jest.runOnlyPendingTimers();

    // At this point, our 1-second timer should have fired it's callback
    expect(callback).toBeCalled();

    // And it should have created a new timer to start the game over in
    // 10 seconds
    expect(setTimeout.mock.calls.length).toBe(2);
    expect(setTimeout.mock.calls[1][1]).toBe(10000);
  });
});
```
Lastly, it may occasionally be useful in some tests to be able to clear all of
the pending timers. For this, we have `jest.clearAllTimers()`.
