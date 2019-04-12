/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment ./EsmDefaultEnvironment.js
 * @my-custom-pragma pragma-value
 */
'use strict';

test('access env', () => {
  expect(property).toBe('value'); // eslint-disable-line no-undef
});

test('docblock pragmas', () => {
  expect(myCustomPragma).toEqual('pragma-value'); // eslint-disable-line no-undef
});
