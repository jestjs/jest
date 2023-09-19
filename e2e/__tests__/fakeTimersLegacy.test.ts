/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe('enableGlobally', () => {
  test('enables legacy fake timers from Jest config', () => {
    const result = runJest('fake-timers-legacy/enable-globally');
    expect(result.exitCode).toBe(0);
  });
});

describe('legacyFakeTimers', () => {
  test('toggles legacy fake timers from Jest config', () => {
    const result = runJest('fake-timers-legacy/enable-legacy-fake-timers');
    expect(result.exitCode).toBe(0);
  });
});

describe('useFakeTimers', () => {
  test('enables legacy fake timers from Jest object', () => {
    const result = runJest('fake-timers-legacy/use-legacy-fake-timers');
    expect(result.exitCode).toBe(0);
  });
});

describe('requestAnimationFrame', () => {
  test('fakes requestAnimationFrame', () => {
    const result = runJest('fake-timers-legacy/request-animation-frame');

    expect(result.stderr).toMatch('requestAnimationFrame test');
    expect(result.exitCode).toBe(0);
  });
});

describe('setImmediate', () => {
  test('fakes setImmediate', () => {
    const result = runJest('fake-timers-legacy/set-immediate');

    expect(result.stderr).toMatch('setImmediate test');
    expect(result.exitCode).toBe(0);
  });
});

describe('useRealTimers', () => {
  test('restores timers to the native implementation', () => {
    const result = runJest('fake-timers-legacy/use-real-timers');
    expect(result.stdout).toMatch('APIs are not mocked with fake timers.');
    expect(result.exitCode).toBe(0);
  });
});

describe('when mocks are reset', () => {
  test('calling resetAllMocks does not break tests', () => {
    const result = runJest('fake-timers-legacy/reset-all-mocks');
    expect(result.exitCode).toBe(0);
  });

  test('setting resetMocks in Jest config does not break tests', () => {
    const result = runJest('fake-timers-legacy/reset-mocks');
    expect(result.exitCode).toBe(0);
  });
});
