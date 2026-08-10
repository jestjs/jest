/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {randomFillSync} = require('crypto');

test('randomFillSync()', () => {
  const buf = Buffer.alloc(10);
  randomFillSync(buf);
});
