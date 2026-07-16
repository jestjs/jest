/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

let i = 0;
const startTimeInSeconds = Date.now();
jest.retryTimes(3, {logErrorsBeforeRetry: true, waitBeforeRetry: 100});
it('retryTimes set with fake timers', () => {
  jest.useFakeTimers();
  i++;
  if (i === 3) {
    expect(Date.now() - startTimeInSeconds).toBeGreaterThan(200);
  } else {
    expect(true).toBeFalsy();
    jest.runAllTimers();
  }
});
