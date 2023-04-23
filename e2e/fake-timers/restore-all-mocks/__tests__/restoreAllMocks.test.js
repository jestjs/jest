/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

beforeEach(() => {
  jest.restoreAllMocks();
});

test('uninstalls spied fake API successfully', () => {
  jest.useFakeTimers();
  jest.spyOn(globalThis, 'setTimeout');
  jest.spyOn(process, 'nextTick');

  expect(jest.isMockFunction(setTimeout)).toBe(true);
  expect(jest.isMockFunction(process.nextTick)).toBe(true);

  jest.useRealTimers();

  expect(jest.isMockFunction(setTimeout)).toBe(false);
  expect(jest.isMockFunction(process.nextTick)).toBe(false);
});

test('does not restore fake implementation', done => {
  expect(setTimeout.clock).toBeUndefined();
  expect(process.nextTick.clock).toBeUndefined();

  setTimeout(done);
});
