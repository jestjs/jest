/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

jest.useFakeTimers();

const pTimeout = require('../p-timeout');

describe('pTimeout', () => {
  it('calls `clearTimeout` and resolves when `promise` resolves.', async () => {
    const onTimeout = jest.fn();
    const promise = Promise.resolve();
    await pTimeout(promise, 1000, clearTimeout, setTimeout, onTimeout);
    expect(setTimeout).toHaveBeenCalled();
    expect(clearTimeout).toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('calls `clearTimeout` and rejects when `promise` rejects.', async () => {
    const onTimeout = jest.fn();
    const promise = Promise.reject();
    try {
      await pTimeout(promise, 1000, clearTimeout, setTimeout, onTimeout);
    } catch (e) {}
    expect(setTimeout).toHaveBeenCalled();
    expect(clearTimeout).toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('calls `onTimeout` on timeout.', async () => {
    const onTimeout = jest.fn();
    // A Promise that never resolves or rejects.
    const promise = new Promise(() => {});
    const timeoutPromise = pTimeout(
      promise,
      1000,
      clearTimeout,
      setTimeout,
      onTimeout,
    );
    jest.runAllTimers();
    await timeoutPromise;
    expect(setTimeout).toHaveBeenCalled();
    expect(onTimeout).toHaveBeenCalled();
  });
});
