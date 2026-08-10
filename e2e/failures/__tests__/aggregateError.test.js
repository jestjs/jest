/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

function connectToPrimary() {
  return Promise.reject(new Error('ECONNREFUSED primary'));
}

function connectToReplica() {
  return Promise.reject(new Error('ETIMEDOUT replica'));
}

it('throws an AggregateError', () => {
  throw new AggregateError([new Error('inner A'), new Error('inner B')]);
});

it('rejects with an AggregateError from Promise.any', async () => {
  await Promise.any([connectToPrimary(), connectToReplica()]);
});
