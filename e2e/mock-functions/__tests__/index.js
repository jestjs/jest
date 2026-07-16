/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('instanceof promise', async () => {
  const resolvedPromise = jest.fn().mockResolvedValue('hello')();
  const rejectedPromise = jest.fn().mockRejectedValue('hello')();

  expect(resolvedPromise).toBeInstanceOf(Promise);
  expect(rejectedPromise).toBeInstanceOf(Promise);

  await expect(resolvedPromise).resolves.toBe('hello');
  await expect(rejectedPromise).rejects.toBe('hello');
});
