/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {setTimeout} = require('timers/promises');

let delta = Date.now();
const includeDelta = false;
const marker = s => {
  console.log(s, includeDelta ? `+${Date.now() - delta}ms` : '');
  delta = Date.now();
};

beforeAll(() => marker('beforeAll'));
afterAll(() => marker('afterAll'));

beforeEach(() => marker('beforeEach'));
afterEach(() => marker('afterEach'));

const testFn = (name, delay, fail) => {
  return async () => {
    marker(`START "${name}"`);
    await setTimeout(delay);
    if (fail) {
      throw new Error(`${name} failed`);
    }
    expect(name).toBe(name);
    expect.assertions(1);
    marker(`END: "${name}"`);
  };
};

it.concurrent('one', testFn('one', 85));
it('two (sequential)', testFn('two (sequential)', 100));

describe('level 1', () => {
  beforeEach(() => marker('beforeEach level 1'));
  afterEach(() => marker('afterEach level 1'));

  it.concurrent('three', testFn('three', 70));

  it('four (sequential)', testFn('four (sequential)', 120));

  describe('level 2', () => {
    beforeEach(() => marker('beforeEach level 2'));
    afterEach(() => marker('afterEach level 2'));
    it.concurrent('five', testFn('five', 160));

    it('six (sequential)', testFn('six (sequential)', 100));
  });

  it.concurrent('seven', testFn('seven', 100));
  it.concurrent('eight', testFn('eight', 120));
});

it.concurrent('nine', testFn('nine', 20));

it.concurrent('ten', testFn('ten', 50));
