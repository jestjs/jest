/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {setTimeout} = require('timers/promises');

test.concurrent('too many assertions', async () => {
  expect.assertions(1);
  await setTimeout(50);
  expect(1).toBe(1);
  expect(2).toBe(2);
});

test.concurrent('ok sibling', async () => {
  expect.assertions(1);
  await setTimeout(50);
  expect(1).toBe(1);
});
