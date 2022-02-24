/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe('modern implementation of fake timers', () => {
  it('should be possible to use modern implementation from config', () => {
    const result = runJest('modern-fake-timers/from-config');
    expect(result.exitCode).toBe(0);
  });

  it('should be possible to use modern implementation from jest-object', () => {
    const result = runJest('modern-fake-timers/from-jest-object');
    expect(result.exitCode).toBe(0);
  });
});
