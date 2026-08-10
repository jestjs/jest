/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

const {promisify} = require('util');

function connectToPrimary() {
  return Promise.reject(new Error('ECONNREFUSED primary'));
}

function connectToReplica() {
  return Promise.reject(new Error('ETIMEDOUT replica'));
}

afterAll(async () => {
  Promise.any([connectToPrimary(), connectToReplica()]);

  await promisify(setTimeout)(0);
});

test('foo', () => {});
