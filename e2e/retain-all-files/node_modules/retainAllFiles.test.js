/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

describe('Test in node_modules', () => {
  test('gets run', () => {
    console.log('I am running from within node_modules');
    expect(true).toBe(true);
  });
});
