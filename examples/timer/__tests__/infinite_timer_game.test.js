// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

'use strict';

jest.useFakeTimers();

it('schedules a 10-second timer after 1 second', () => {
  jest.spyOn(globalThis, 'setTimeout');
  const infiniteTimerGame = require('../infiniteTimerGame');
  const callback = jest.fn();

  infiniteTimerGame(callback);

  // At this point in time, there should have been a single call to
  // setTimeout to schedule the end of the game in 1 second.
  expect(setTimeout).toHaveBeenCalledTimes(1);
  expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 1000);

  // Fast forward and exhaust only currently pending timers
  // (but not any new timers that get created during that process)
  jest.runOnlyPendingTimers();

  // At this point, our 1-second timer should have fired its callback
  expect(callback).toHaveBeenCalled();

  // And it should have created a new timer to start the game over in
  // 10 seconds
  expect(setTimeout).toHaveBeenCalledTimes(2);
  expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), 10000);
});
