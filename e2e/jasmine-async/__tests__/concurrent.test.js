/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const marker = s => console.log(`[[${s}]]`);

beforeAll(() => marker('beforeAll'));
afterAll(() => marker('afterAll'));

beforeEach(() => marker('beforeEach'));
afterEach(() => marker('afterEach'));

it.concurrent('one', () => {
  marker('test');
  return Promise.resolve();
});
it.concurrent.skip('two', () => {
  marker('test');
  return Promise.resolve();
});
it.concurrent('three', () => {
  marker('test');
  return Promise.resolve();
});
it.concurrent('concurrent test fails', () => {
  marker('test');
  return Promise.reject();
});
