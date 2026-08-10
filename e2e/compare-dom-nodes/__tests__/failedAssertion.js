/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* global document */

test('a failed assertion comparing a DOM node does not crash Jest', () => {
  expect(document.body).toBeNull();
});
