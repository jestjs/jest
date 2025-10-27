/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const realSetTimeout = setTimeout;

describe('jest.setTimerTickMode', () => {
  it('should not advance the clock with manual', async () => {
    jest.useFakeTimers();
    jest.setTimerTickMode({mode: 'manual'});
    const spy = jest.fn();
    setTimeout(spy, 5);
    await new Promise(resolve => realSetTimeout(resolve, 20));
    expect(spy).not.toHaveBeenCalled();
  });

  it('should advance the clock to next timer with nextAsync', async () => {
    jest.useFakeTimers();
    jest.setTimerTickMode({mode: 'nextAsync'});
    await new Promise(resolve => setTimeout(resolve, 5000));
    await new Promise(resolve => setTimeout(resolve, 5000));
    await new Promise(resolve => setTimeout(resolve, 5000));
    await new Promise(resolve => setTimeout(resolve, 5000));
    // test should not time out
  });

  it('should advance the clock in real time with delta', async () => {
    jest.useFakeTimers();
    jest.setTimerTickMode({delta: 10, mode: 'interval'});
    const spy = jest.fn();
    setTimeout(spy, 10);
    await new Promise(resolve => realSetTimeout(resolve, 5));
    expect(spy).not.toHaveBeenCalled();
    await new Promise(resolve => realSetTimeout(resolve, 5));
    expect(spy).toHaveBeenCalled();
  });
});
