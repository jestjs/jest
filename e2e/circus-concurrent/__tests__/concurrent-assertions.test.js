/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {setTimeout} = require('timers/promises');

test.concurrent('assertions one', async () => {
  expect.assertions(1);
  await setTimeout(50);
  expect(1).toBe(1);
});

test.concurrent('assertions two', async () => {
  expect.assertions(1);
  await setTimeout(50);
  expect(2).toBe(2);
});

test.concurrent('hasAssertions', async () => {
  expect.hasAssertions();
  await setTimeout(50);
  expect(3).toBe(3);
});

test('sequential assertions', async () => {
  expect.assertions(1);
  await setTimeout(50);
  expect('seq').toBe('seq');
});
