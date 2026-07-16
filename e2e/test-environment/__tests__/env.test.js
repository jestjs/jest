/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jsdom
 */
'use strict';
/* global document */

test('stub', () => {
  const element = document.createElement('div');
  expect(element).not.toBeNull();
});
