/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

describe('one', () => {
  it.concurrent('concurrent test gets skipped', () => {
    console.log(`this is not logged ${Math.random()}`);
    return Promise.resolve();
  });
  it.concurrent('concurrent test fails', () => {
    console.log(`this is logged ${Math.random()}`);
    return Promise.reject(new Error());
  });
});
