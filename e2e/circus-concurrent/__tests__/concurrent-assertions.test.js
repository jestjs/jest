/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {setTimeout} = require('timers/promises');

test.concurrent('assertions one', async () => {
  expect.assertions(1);
  await setTimeout(50);
  expect(1).toBe(1);
});

test.concurrent('assertions two', async () => {
  expect.assertions(1);
  await setTimeout(50);
  expect(2).toBe(2);
});

test.concurrent('hasAssertions', async () => {
  expect.hasAssertions();
  await setTimeout(50);
  expect(3).toBe(3);
});

test('sequential assertions', async () => {
  expect.assertions(1);
  await setTimeout(50);
  expect('seq').toBe('seq');
});

let release;
const bothAsserted = new Promise(resolve => {
  release = resolve;
});
let assertionsMade = 0;

test.concurrent.each([1, 2])('same title', async value => {
  expect.assertions(1);
  expect(value).toBeGreaterThan(0);
  if (++assertionsMade === 2) {
    release();
  }
  await bothAsserted;
});

describe('assertions in hooks', () => {
  beforeAll(() => {
    expect('setup').toBe('setup');
  });

  test.concurrent('includes the assertion from beforeAll', () => {
    expect.assertions(2);
    expect('test').toBe('test');
  });

  afterAll(() => {
    expect(expect.getState().currentTestName).toBe(
      'assertions in hooks includes the assertion from beforeAll',
    );
  });
});
