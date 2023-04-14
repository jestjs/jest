/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {toMatchInlineSnapshot} = require('jest-snapshot');
expect.extend({
  toMatchCustomInlineSnapshot(received, ...args) {
    return toMatchInlineSnapshot.call(this, received, ...args);
  },
});
test('inline snapshots', () => {
  expect({apple: 'original value'}).toMatchCustomInlineSnapshot();
});
