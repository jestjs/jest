/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

jest.retryTimes(3, {logErrorsBeforeRetry: true, retryImmediately: true});
let i = 0;
it('retryTimes set', () => {
  i++;
  if (i === 3) {
    console.log('FIRST TRUTHY TEST');
    expect(true).toBeTruthy();
  } else {
    expect(true).toBeFalsy();
  }
});
it('truthy test', () => {
  console.log('SECOND TRUTHY TEST');
  expect(true).toBeTruthy();
});
