/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {jest} from '@jest/globals';

test('should have a fresh module state in each isolateModulesAsync context', async () => {
  await jest.isolateModulesAsync(async () => {
    const {getState, incState} = await import('../main.js');
    expect(getState()).toBe(0);
    incState();
    expect(getState()).toBe(1);
  });
  await jest.isolateModulesAsync(async () => {
    const {getState, incState} = await import('../main.js');
    expect(getState()).toBe(0);
    incState();
    expect(getState()).toBe(1);
  });
});
