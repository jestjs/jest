/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as timersPromises from 'node:timers/promises';
import {expect, jest, test} from '@jest/globals';

afterEach(() => {
  jest.useRealTimers();
});

test('setTimeout resolves when the fake clock advances', async () => {
  jest.useFakeTimers();

  const promise = timersPromises.setTimeout(1000);

  expect(jest.getTimerCount()).toBe(1);

  await jest.advanceTimersByTimeAsync(1000);
  await expect(promise).resolves.toBeUndefined();
  expect(jest.getTimerCount()).toBe(0);
});

test('setImmediate and setInterval are driven by the fake clock', async () => {
  jest.useFakeTimers();

  const immediate = timersPromises.setImmediate('immediate');
  const iterator = timersPromises.setInterval(100, 'tick');
  const tick = iterator.next();

  await jest.advanceTimersByTimeAsync(100);

  await expect(immediate).resolves.toBe('immediate');
  await expect(tick).resolves.toEqual({done: false, value: 'tick'});

  await iterator.return();
  expect(jest.getTimerCount()).toBe(0);
});
