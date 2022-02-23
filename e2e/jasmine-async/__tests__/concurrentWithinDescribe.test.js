/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

describe('one', () => {
  it.concurrent('concurrent test gets skipped', () => Promise.resolve());
  it.concurrent('concurrent test fails', () => Promise.reject());
});
