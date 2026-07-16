/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let i = 0;
jest.retryTimes(3, {logErrorsBeforeRetry: true});
it('retryTimes set', () => {
  i++;
  if (i === 3) {
    expect(true).toBeTruthy();
  } else {
    expect(true).toBeFalsy();
  }
});
