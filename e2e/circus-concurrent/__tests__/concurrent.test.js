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
const hookFn = (name, delay) => {
  return async () => {
    marker(`START hook "${name}"`);
    await setTimeout(delay);
    marker(`END hook: "${name}"`);
  };
};

it.concurrent('one', testFn('one', 85));
it.concurrent('two', testFn('two', 100));

describe('level 1', () => {
  beforeEach(() => marker('beforeEach level 1'));
  afterEach(() => marker('afterEach level 1'));

  it.concurrent('three', testFn('three', 70));
  it.concurrent('four', testFn('four', 120));

  describe('level 2, group 1', () => {
    beforeAll(hookFn('beforeAll level 2, group 1', 85));
    afterAll(hookFn('afterAll level 2, group 1', 85));

    beforeEach(hookFn('beforeEach level 2, group 1', 85));
    afterEach(hookFn('afterEach level 2, group 1', 85));

    it.concurrent('five', testFn('five', 160));
    it.concurrent('six', testFn('six', 100));
  });
  describe('level 2, group 2', () => {
    beforeAll(hookFn('beforeAll level 2, group 2', 85));
    afterAll(hookFn('afterAll level 2, group 2', 85));

    beforeEach(hookFn('beforeEach level 2, group 2', 85));
    afterEach(hookFn('afterEach level 2, group 2', 85));

    it.concurrent('seven', testFn('seven', 160));
    it.concurrent('eight', testFn('eight', 100));
  });

  it.concurrent('nine', testFn('nine', 100));
  it.concurrent('ten', testFn('ten', 120));
});

it.concurrent('eleven', testFn('eleven', 20));
it.concurrent('twelve', testFn('twelve', 50));
