/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeGlobalConfig} from '@jest/test-utils';
import {BrowserTestRunner} from '../index';

describe('BrowserTestRunner', () => {
  test('isSerial is false (parallel by default)', () => {
    const runner = new BrowserTestRunner(makeGlobalConfig());
    expect(runner.isSerial).toBe(false);
  });

  test('supportsEventEmitters is false', () => {
    const runner = new BrowserTestRunner(makeGlobalConfig());
    expect(runner.supportsEventEmitters).toBe(false);
  });
});
