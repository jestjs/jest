// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

'use strict';

jest.useFakeTimers();

describe('timerGame', () => {
  beforeEach(() => {
    jest.spyOn(globalThis, 'setTimeout');
  });
  it('waits 1 second before ending the game', () => {
    const timerGame = require('../timerGame');
    timerGame();

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
  });

  it('calls the callback after 1 second via runAllTimers', () => {
    const timerGame = require('../timerGame');
    const callback = jest.fn();

    timerGame(callback);

    // At this point in time, the callback should not have been called yet
    expect(callback).not.toHaveBeenCalled();

    // Fast-forward until all timers have been executed
    jest.runAllTimers();

    // Now our callback should have been called!
    expect(callback).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('calls the callback after 1 second via advanceTimersByTime', () => {
    const timerGame = require('../timerGame');
    const callback = jest.fn();

    timerGame(callback);

    // At this point in time, the callback should not have been called yet
    expect(callback).not.toHaveBeenCalled();

    // Fast-forward until all timers have been executed
    jest.advanceTimersByTime(1000);

    // Now our callback should have been called!
    expect(callback).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
