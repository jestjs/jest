/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

const {promisify} = require('util');

beforeAll(async () => {
  const promise = Promise.reject(new Error('REJECTED'));

  await promisify(setTimeout)(0);

  await expect(promise).rejects.toThrow(/REJECTED/);
});

beforeEach(async () => {
  const promise = Promise.reject(new Error('REJECTED'));

  await promisify(setTimeout)(0);

  await expect(promise).rejects.toThrow(/REJECTED/);
});

afterEach(async () => {
  const promise = Promise.reject(new Error('REJECTED'));

  await promisify(setTimeout)(0);

  await expect(promise).rejects.toThrow(/REJECTED/);
});

afterAll(async () => {
  const promise = Promise.reject(new Error('REJECTED'));

  await promisify(setTimeout)(0);

  await expect(promise).rejects.toThrow(/REJECTED/);
});

test('async function succeeds because the promise is eventually awaited by assertion', async () => {
  const promise = Promise.reject(new Error('REJECTED'));

  await promisify(setTimeout)(0);

  await expect(promise).rejects.toThrow(/REJECTED/);
});

test('async function succeeds because the promise is eventually directly awaited', async () => {
  const promise = Promise.reject(new Error('REJECTED'));

  await promisify(setTimeout)(0);

  try {
    await promise;
  } catch (error) {
    expect(error).toEqual(new Error('REJECTED'));
  }
});

test('sync function succeeds because the promise is eventually handled by `.catch` handler', done => {
  const promise = Promise.reject(new Error('REJECTED'));

  setTimeout(() => {
    promise
      .catch(error => {
        expect(error).toEqual(new Error('REJECTED'));
      })
      .finally(done);
  }, 0);
});
