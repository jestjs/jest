/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

function g() {
  throw new Error('error during g');
}
function f() {
  try {
    g();
  } catch (err) {
    throw new Error('error during f', {cause: err});
  }
}

test('error with cause in test', () => {
  f();
});

describe('describe block', () => {
  it('error with cause in describe/it', () => {
    f();
  });
});
