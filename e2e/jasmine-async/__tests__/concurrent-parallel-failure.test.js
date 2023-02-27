/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

it.concurrent('Good Test', async () => {
  await new Promise(r => setTimeout(r, 100));
});

it.concurrent('Bad Test', async () => {
  expect('a').toBe('b');
});
