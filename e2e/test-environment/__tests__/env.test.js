/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jsdom
 */
'use strict';
/* eslint-env browser*/

test('stub', () => {
  const element = document.createElement('div');
  expect(element).not.toBeNull();
});
