/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

jest.retryTimes(3);

it.concurrent('retryTimes set', () => {
  expect(true).toBeFalsy();
});

it.concurrent('truthy test', () => {
  expect(true).toBeTruthy();
});
