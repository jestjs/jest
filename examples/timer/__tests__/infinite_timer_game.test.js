// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

jest.useFakeTimers();

it('schedules a 10-second timer after 1 second', () => {
  const infiniteTimerGame = require('../infiniteTimerGame');
  const callback = jest.fn();

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
