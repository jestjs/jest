/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

test('throws error', () => {
  // Named function to have the function be named the same in jasmine and circus
  new Promise(resolve => setTimeout(resolve, 500)).then(function log() {
    console.log('hello!');
  });
});
