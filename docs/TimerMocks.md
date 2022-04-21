---
id: timer-mocks
title: Timer Mocks
---

The native timer functions (i.e., `setTimeout()`, `setInterval()`, `clearTimeout()`, `clearInterval()`) are less than ideal for a testing environment since they depend on real time to elapse. Jest can swap out timers with functions that allow you to control the passage of time. [Great Scott!](https://www.youtube.com/watch?v=QZoJ2Pt27BY)

:::info

Also see [Fake Timers API](JestObjectAPI.md#fake-timers) documentation.

:::

## Enable Fake Timers

In the following example we enable fake timers by calling `jest.useFakeTimers()`. This is replacing the original implementation of `setTimeout()` and other timer functions. Timers can be restored to their normal behavior with `jest.useRealTimers()`.

```javascript title="timerGame.js"
function timerGame(callback) {
  console.log('Ready....go!');
  setTimeout(() => {
    console.log("Time's up -- stop!");
    callback && callback();
  }, 1000);
}

module.exports = timerGame;
```

```javascript title="__tests__/timerGame-test.js"
jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

test('waits 1 second before ending the game', () => {
  const timerGame = require('../timerGame');
  timerGame();

  expect(setTimeout).toHaveBeenCalledTimes(1);
  expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
});
```

## Run All Timers

Another test we might want to write for this module is one that asserts that the callback is called after 1 second. To do this, we're going to use Jest's timer control APIs to fast-forward time right in the middle of the test:

```javascript
jest.useFakeTimers();
test('calls the callback after 1 second', () => {
  const timerGame = require('../timerGame');
  const callback = jest.fn();

  timerGame(callback);

  // At this point in time, the callback should not have been called yet
  expect(callback).not.toBeCalled();

  // Fast-forward until all timers have been executed
  jest.runAllTimers();

  // Now our callback should have been called!
  expect(callback).toBeCalled();
  expect(callback).toHaveBeenCalledTimes(1);
});
```

## Run Pending Timers

There are also scenarios where you might have a recursive timer – that is a timer that sets a new timer in its own callback. For these, running all the timers would be an endless loop, throwing the following error: "Aborting after running 100000 timers, assuming an infinite loop!"

If that is your case, using `jest.runOnlyPendingTimers()` will solve the problem:

```javascript title="infiniteTimerGame.js"
function infiniteTimerGame(callback) {
  console.log('Ready....go!');

  setTimeout(() => {
    console.log("Time's up! 10 seconds before the next game starts...");
    callback && callback();

    // Schedule the next game in 10 seconds
    setTimeout(() => {
      infiniteTimerGame(callback);
    }, 10000);
  }, 1000);
}

module.exports = infiniteTimerGame;
```

```javascript title="__tests__/infiniteTimerGame-test.js"
jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

describe('infiniteTimerGame', () => {
  test('schedules a 10-second timer after 1 second', () => {
    const infiniteTimerGame = require('../infiniteTimerGame');
    const callback = jest.fn();

    infiniteTimerGame(callback);

    // At this point in time, there should have been a single call to
    // setTimeout to schedule the end of the game in 1 second.
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);

    // Fast forward and exhaust only currently pending timers
    // (but not any new timers that get created during that process)
    jest.runOnlyPendingTimers();

    // At this point, our 1-second timer should have fired its callback
    expect(callback).toBeCalled();

    // And it should have created a new timer to start the game over in
    // 10 seconds
    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 10000);
  });
});
```

:::note

For debugging or any other reason you can change the limit of timers that will be run before throwing an error:

```js
jest.useFakeTimers({timerLimit: 100});
```

:::

## Advance Timers by Time

Another possibility is use `jest.advanceTimersByTime(msToRun)`. When this API is called, all timers are advanced by `msToRun` milliseconds. All pending "macro-tasks" that have been queued via setTimeout() or setInterval(), and would be executed during this time frame, will be executed. Additionally, if those macro-tasks schedule new macro-tasks that would be executed within the same time frame, those will be executed until there are no more macro-tasks remaining in the queue that should be run within msToRun milliseconds.

```javascript title="timerGame.js"
function timerGame(callback) {
  console.log('Ready....go!');
  setTimeout(() => {
    console.log("Time's up -- stop!");
    callback && callback();
  }, 1000);
}

module.exports = timerGame;
```

```javascript title="__tests__/timerGame-test.js"
jest.useFakeTimers();
it('calls the callback after 1 second via advanceTimersByTime', () => {
  const timerGame = require('../timerGame');
  const callback = jest.fn();

  timerGame(callback);

  // At this point in time, the callback should not have been called yet
  expect(callback).not.toBeCalled();

  // Fast-forward until all timers have been executed
  jest.advanceTimersByTime(1000);

  // Now our callback should have been called!
  expect(callback).toBeCalled();
  expect(callback).toHaveBeenCalledTimes(1);
});
```

Lastly, it may occasionally be useful in some tests to be able to clear all of the pending timers. For this, we have `jest.clearAllTimers()`.

## Selective Faking

Sometimes your code may require to avoid overwriting the original implementation of one or another API. If that is the case, you can use `doNotFake` option. For example, here is how you could provide a custom mock function for `performance.mark()` in jsdom environment:

```js
/**
 * @jest-environment jsdom
 */

const mockPerformanceMark = jest.fn();
window.performance.mark = mockPerformanceMark;

test('allows mocking `performance.mark()`', () => {
  jest.useFakeTimers({doNotFake: ['performance']});

  expect(window.performance.mark).toBe(mockPerformanceMark);
});
```
