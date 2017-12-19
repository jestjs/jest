// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

jest.useFakeTimers();

describe('timerGame', () => {
  it('waits 1 second before ending the game', () => {
    const timerGame = require('../timerGame');
    timerGame();

    expect(setTimeout.mock.calls.length).toBe(1);
    expect(setTimeout.mock.calls[0][1]).toBe(1000);
  });

  it('calls the callback after 1 second via runAllTimers', () => {
    const timerGame = require('../timerGame');
    const callback = jest.fn();

    timerGame(callback);

    // At this point in time, the callback should not have been called yet
    expect(callback).not.toBeCalled();

    // Fast-forward until all timers have been executed
    jest.runAllTimers();

    // Now our callback should have been called!
    expect(callback).toBeCalled();
    expect(callback.mock.calls.length).toBe(1);
  });

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
    expect(callback.mock.calls.length).toBe(1);
  });
});
