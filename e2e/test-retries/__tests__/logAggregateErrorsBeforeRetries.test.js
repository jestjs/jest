/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

function connectToPrimary() {
  return Promise.reject(new Error('ECONNREFUSED primary'));
}

function connectToReplica() {
  return Promise.reject(new Error('ETIMEDOUT replica'));
}

let i = 0;
jest.retryTimes(3, {logErrorsBeforeRetry: true});
it('retryTimes set', async () => {
  i++;
  if (i !== 3) {
    await Promise.any([connectToPrimary(), connectToReplica()]);
  }
});
