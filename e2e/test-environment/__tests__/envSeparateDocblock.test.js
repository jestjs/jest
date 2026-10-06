/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @jest-environment jsdom
 */
'use strict';
/* global document */

test('the pragma applies even though it is not the first docblock', () => {
  const element = document.createElement('div');
  expect(element).not.toBeNull();
});
