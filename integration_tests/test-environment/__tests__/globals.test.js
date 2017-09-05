/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @jest-environment node
 */
'use strict';
/* eslint-env node */

test('globals', () => {
  const buf = Buffer.from('hello');
  expect(buf instanceof Uint8Array).toEqual(true);
});
