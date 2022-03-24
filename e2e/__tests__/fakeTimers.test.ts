/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
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
});

describe('requestAnimationFrame', () => {
  test('fakes requestAnimationFrame', () => {
    const result = runJest('fake-timers/request-animation-frame');

    expect(result.stderr).toMatch('requestAnimationFrame test');
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

describe('useRealTimers', () => {
  test('restores timers to the native implementation', () => {
    const result = runJest('fake-timers/use-real-timers');
    expect(result.stdout).toMatch('API is not mocked with fake timers.');
    expect(result.exitCode).toBe(0);
  });
});
