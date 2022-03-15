/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe('enableGlobally', () => {
  test('enables legacy fake timers from Jest Config', () => {
    const result = runJest('fake-timers-legacy/enable-globally');
    expect(result.exitCode).toBe(0);
  });
});

describe('useFakeTimers', () => {
  test('enables legacy fake timers from Jest Object', () => {
    const result = runJest('fake-timers-legacy/use-fake-timers');
    expect(result.exitCode).toBe(0);
  });
});

describe('requestAnimationFrame', () => {
  test('fakes requestAnimationFrame', () => {
    const result = runJest('fake-timers-legacy/request-animation-frame', [
      '--verbose',
    ]);

    expect(result.stderr).toMatch('requestAnimationFrame test');
    expect(result.exitCode).toBe(0);
  });
});
