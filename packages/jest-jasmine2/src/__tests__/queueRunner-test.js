/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

const queueRunner = require('../queueRunner');

describe('queueRunner', () => {
  it('runs every function in the queue.', async () => {
    const fnOne = jest.fn(next => next());
    const fnTwo = jest.fn(next => next());
    const onComplete = jest.fn();
    const options = {
      clearTimeout,
      fail: () => {},
      onComplete,
      onException: () => {},
      queueableFns: [
        {
          fn: fnOne,
        },
        {
          fn: fnTwo,
        },
      ],
      setTimeout,
    };
    await queueRunner(options);
    expect(fnOne).toHaveBeenCalled();
    expect(fnTwo).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('exposes `fail` to `next`.', async () => {
    const fail = jest.fn();
    const fnOne = jest.fn(next => next.fail());
    const fnTwo = jest.fn(next => next());
    const onComplete = jest.fn();
    const options = {
      clearTimeout,
      fail,
      onComplete,
      onException: () => {},
      queueableFns: [
        {
          fn: fnOne,
        },
        {
          fn: fnTwo,
        },
      ],
      setTimeout,
    };
    await queueRunner(options);
    expect(fnOne).toHaveBeenCalled();
    expect(fail).toHaveBeenCalled();
    // Even if `fail` is called, the queue keeps running.
    expect(fnTwo).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('passes errors to `onException`.', async () => {
    const error = new Error('The error a test throws.');
    const fnOne = jest.fn(() => {
      throw error;
    });
    const fnTwo = jest.fn(next => next());
    const onComplete = jest.fn();
    const onException = jest.fn();
    const options = {
      clearTimeout,
      fail: () => {},
      onComplete,
      onException,
      queueableFns: [
        {
          fn: fnOne,
        },
        {
          fn: fnTwo,
        },
      ],
      setTimeout,
    };
    await queueRunner(options);
    expect(fnOne).toHaveBeenCalled();
    expect(onException).toHaveBeenCalledWith(error);
    // Even if one of them errors, the queue keeps running.
    expect(fnTwo).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('passes an error to `onException` on timeout.', async () => {
    const fnOne = jest.fn(next => {});
    const fnTwo = jest.fn(next => next());
    const onComplete = jest.fn();
    const onException = jest.fn();
    const options = {
      clearTimeout,
      fail: () => {},
      onComplete,
      onException,
      queueableFns: [
        {
          fn: fnOne,
          // It times out in zero seconds.
          timeout: () => 0,
        },
        {
          fn: fnTwo,
        },
      ],
      setTimeout,
    };
    await queueRunner(options);
    expect(fnOne).toHaveBeenCalled();
    expect(onException).toHaveBeenCalled();
    // i.e. the `message` of the error passed to `onException`.
    expect(onException.mock.calls[0][0].message).toEqual(
      'Timeout - Async callback was not invoked within timeout specified ' +
        'by jasmine.DEFAULT_TIMEOUT_INTERVAL.',
    );
    expect(fnTwo).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });
});
