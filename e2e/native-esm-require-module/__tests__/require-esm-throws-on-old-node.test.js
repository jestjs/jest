/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('require() of ESM throws ERR_REQUIRE_ESM with a Node-version message', () => {
  expect(() => require('../esm.mjs')).toThrow(
    expect.objectContaining({
      code: 'ERR_REQUIRE_ESM',
      message: expect.stringMatching(
        /Must use import to load ES Module[\s\S]+Node v24\.9\+/,
      ),
    }),
  );
});
