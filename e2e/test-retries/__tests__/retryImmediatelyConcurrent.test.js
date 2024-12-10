/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

jest.retryTimes(3, {logErrorsBeforeRetry: true, retryImmediately: true});
let i1 = 0;
it.concurrent('retryable test 1', () => {
  i1++;
  if (i1 === 3) {
    console.log('SECOND TRUTHY TEST');
    expect(true).toBeTruthy();
  } else {
    expect(true).toBeFalsy();
  }
});

let i2 = 0;
it.concurrent('retryable test 2', () => {
  i2++;
  if (i2 === 3) {
    console.log('THIRD TRUTHY TEST');
    expect(true).toBeTruthy();
  } else {
    expect(true).toBeFalsy();
  }
});
it.concurrent('truthy test', () => {
  console.log('FIRST TRUTHY TEST');
  expect(true).toBeTruthy();
});
