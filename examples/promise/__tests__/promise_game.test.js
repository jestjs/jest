'use strict';

jest.useFakePromises();

describe('promiseGame', () => {
  it('runs all queued promises', () => {
    const promiseGame = require('../promiseGame');
    const callback = jest.fn();
    const runAllTicks = jest.fn();

    promiseGame(callback);

    // At this point, the promise callback should not have been called yet
    expect(callback).not.toBeCalled();

    // Fast-forward until all promises are completed
    jest.runAllPromises(runAllTicks);

    // Now our callback should have been called!
    expect(callback).toBeCalled();
    expect(callback.mock.calls.length).toBe(1);

    // Check that all ticks have been run
    expect(runAllTicks).toBeCalled();
    expect(runAllTicks.mock.calls.length).toBeGreaterThan(0);
  });
});
