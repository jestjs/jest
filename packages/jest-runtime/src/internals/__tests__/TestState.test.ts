/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TestState} from '../TestState';

describe('TestState', () => {
  test('starts in `loading`: not tornDown, not betweenTests', () => {
    const state = new TestState(jest.fn());
    expect(state.isTornDown()).toBe(false);
    expect(state.isBetweenTests()).toBe(false);
  });

  test('enterTestCode does not register as betweenTests or tornDown', () => {
    const state = new TestState(jest.fn());
    state.enterTestCode();
    expect(state.isBetweenTests()).toBe(false);
    expect(state.isTornDown()).toBe(false);
  });

  test('leaveTestCode flips isBetweenTests', () => {
    const state = new TestState(jest.fn());
    state.enterTestCode();
    state.leaveTestCode();
    expect(state.isBetweenTests()).toBe(true);
    expect(state.isTornDown()).toBe(false);
  });

  test('teardown flips isTornDown and clears betweenTests', () => {
    const state = new TestState(jest.fn());
    state.enterTestCode();
    state.leaveTestCode();
    state.teardown();
    expect(state.isTornDown()).toBe(true);
    expect(state.isBetweenTests()).toBe(false);
  });

  test('bailIfTornDown returns false and does not log before teardown', () => {
    const log = jest.fn();
    const state = new TestState(log);
    expect(state.bailIfTornDown('msg')).toBe(false);
    expect(log).not.toHaveBeenCalled();
  });

  test('bailIfTornDown logs, sets exitCode, returns true after teardown', () => {
    const original = process.exitCode;
    process.exitCode = 0;
    try {
      const log = jest.fn();
      const state = new TestState(log);
      state.teardown();
      expect(state.bailIfTornDown('boom message')).toBe(true);
      expect(log).toHaveBeenCalledWith('boom message');
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = original;
    }
  });

  test('bailIfTornDown does not bail in betweenTests', () => {
    const log = jest.fn();
    const state = new TestState(log);
    state.enterTestCode();
    state.leaveTestCode();
    expect(state.bailIfTornDown('msg')).toBe(false);
    expect(log).not.toHaveBeenCalled();
  });

  test('throwIfTornDown is a no-op before teardown', () => {
    const log = jest.fn();
    const state = new TestState(log);
    expect(() => state.throwIfTornDown('msg')).not.toThrow();
    expect(log).not.toHaveBeenCalled();
  });

  test('throwIfBetweenTests is a no-op outside the betweenTests window', () => {
    const log = jest.fn();
    const state = new TestState(log);
    expect(() => state.throwIfBetweenTests('msg')).not.toThrow();
    state.enterTestCode();
    expect(() => state.throwIfBetweenTests('msg')).not.toThrow();
    state.leaveTestCode();
    state.teardown();
    // Torn down past betweenTests; should not fire either.
    expect(() => state.throwIfBetweenTests('msg')).not.toThrow();
    expect(log).not.toHaveBeenCalled();
  });

  test('throwIfBetweenTests throws ReferenceError between tests, no log/exitCode', () => {
    const original = process.exitCode;
    process.exitCode = 0;
    try {
      const log = jest.fn();
      const state = new TestState(log);
      state.enterTestCode();
      state.leaveTestCode();
      expect(() => state.throwIfBetweenTests('boom')).toThrow(
        new ReferenceError('boom'),
      );
      expect(log).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(0);
    } finally {
      process.exitCode = original;
    }
  });

  test('throwIfTornDown logs, sets exitCode, throws ReferenceError after teardown', () => {
    const original = process.exitCode;
    process.exitCode = 0;
    try {
      const log = jest.fn();
      const state = new TestState(log);
      state.teardown();
      expect(() => state.throwIfTornDown('boom message')).toThrow(
        new ReferenceError('boom message'),
      );
      expect(log).toHaveBeenCalledWith('boom message');
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = original;
    }
  });
});
