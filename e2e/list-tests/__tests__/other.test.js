/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

it("isn't actually run", () => {
  // (because it is only used for --listTests)
  expect(true).toBe(false);
});

// Because of this comment, other.test.js is slightly larger than dummy.test.js.
// This matters for the order in which tests are sequenced.
