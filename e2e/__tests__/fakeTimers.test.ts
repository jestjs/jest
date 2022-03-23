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
