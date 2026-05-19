/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

describe('DefaultSuite', () => {
  it('default test passes', () => {
    console.log('this log should appear');
    expect(1).toBe(1);
  });
});
