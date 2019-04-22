/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment ./EsmDefaultEnvironment.js
 */
'use strict';

test('access env', () => {
  expect(property).toBe('value'); // eslint-disable-line no-undef
});
