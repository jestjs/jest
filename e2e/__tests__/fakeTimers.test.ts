/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe('enableGlobally', () => {
  test('enables fake timers from Jest config', () => {
    const result = runJest('fake-timers/enable-globally');
    expect(result.exitCode).toBe(0);
  });
});

describe('useFakeTimers', () => {
  test('enables fake timers from Jest object', () => {
    const result = runJest('fake-timers/use-fake-timers');
    expect(result.exitCode).toBe(0);
  });

  test('allows to pass advanceTimers option', () => {
    const result = runJest('fake-timers/advance-timers');
    expect(result.exitCode).toBe(0);
  });

  test('allows to pass doNotFake option', () => {
    const result = runJest('fake-timers/do-not-fake');
    expect(result.exitCode).toBe(0);
  });

  test('allows to pass timerLimit option', () => {
    const result = runJest('fake-timers/timer-limit');
    expect(result.exitCode).toBe(0);
  });

  test('allows clearing not faked timers', () => {
    const result = runJest('fake-timers/clear-real-timers');
    expect(result.exitCode).toBe(0);
  });
});

describe('setImmediate', () => {
  test('fakes setImmediate', () => {
    const result = runJest('fake-timers/set-immediate');

    expect(result.stderr).toMatch('setImmediate test');
    expect(result.exitCode).toBe(0);
  });
});

describe('requestAnimationFrame', () => {
  test('fakes requestAnimationFrame', () => {
    const result = runJest('fake-timers/request-animation-frame');

    expect(result.stderr).toMatch('requestAnimationFrame test');
    expect(result.exitCode).toBe(0);
  });
});

describe('useRealTimers', () => {
  test('restores timers to the native implementation', () => {
    const result = runJest('fake-timers/use-real-timers');
    expect(result.stdout).toMatch('APIs are not replaced with fake timers.');
    expect(result.exitCode).toBe(0);
  });
});
