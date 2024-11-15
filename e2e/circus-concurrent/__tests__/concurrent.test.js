/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {setTimeout} = require('timers/promises');

const marker = s => console.log(`[[${s}]]`);

beforeAll(() => marker('beforeAll'));
afterAll(() => marker('afterAll'));

beforeEach(() => marker('beforeEach'));
afterEach(() => marker('afterEach'));

const testFn = (name, delay, fail) => {
  return async () => {
    marker(`test ${name} start`);
    await setTimeout(delay);
    if (fail) {
      throw new Error(`${name} failed`);
    }
    expect(name).toBe(name);
    expect.assertions(1);
    marker(`test ${name} end`);
  };
};

it.concurrent('one', testFn('one', 100));
it.concurrent.skip('two (skipped)', testFn('two (skipped)', 100));

describe('level 1', () => {
  beforeEach(() => marker('beforeEach level 1'));
  afterEach(() => marker('afterEach level 1'));

  it.concurrent('three', testFn('three', 60));

  it.concurrent.skip('four (skipped)', testFn('four (skipped)', 100));

  describe('level 2', () => {
    beforeEach(() => marker('beforeEach level 2'));
    afterEach(() => marker('afterEach level 2'));
    it.concurrent('five', testFn('five', 150));

    it.concurrent('six', testFn('six', 100));
  });

  it.concurrent('seven (fails)', testFn('seven (fails)', 100, true));
  it.concurrent('eight', testFn('eight', 50));
});

it.concurrent('nine', testFn('nine', 20));

it.concurrent('ten (fails)', testFn('ten (fails)', 30, true));
