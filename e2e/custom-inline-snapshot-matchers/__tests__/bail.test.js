/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const {toMatchInlineSnapshot} = require('jest-snapshot');

expect.extend({
  toMatchBailingInlineSnapshot(...args) {
    this.dontThrow = () => {};

    return toMatchInlineSnapshot.call(this, ...args);
  },
});

test('matches both snapshots', () => {
  expect('two').toMatchBailingInlineSnapshot(`"one"`);
  expect('three').toMatchBailingInlineSnapshot(`"two"`);
});
