/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let hasBeforeAllRun = false;
let hasAfterAllRun = false;

describe.skip('in describe.skip', () => {
  describe('in describe', () => {
    beforeAll(() => {
      hasBeforeAllRun = true;
    });

    afterAll(() => {
      hasAfterAllRun = true;
    });

    test('it should be skipped', () => {
      throw new Error('This should never happen');
    });

    // eslint-disable-next-line jest/no-focused-tests
    test.only('it should be skipped as well', () => {
      throw new Error('This should never happen');
    });

    test.todo('it should also be skipped');
  });
});

test('describe.skip should not run beforeAll', () => {
  expect(hasBeforeAllRun).toBe(false);
});

test('describe.skip should not run afterAll', () => {
  expect(hasAfterAllRun).toBe(false);
});

let hasBeforeAllRun2 = false;
let hasAfterAllRun2 = false;

describe('in describe', () => {
  beforeAll(() => {
    hasBeforeAllRun2 = true;
  });

  afterAll(() => {
    hasAfterAllRun2 = true;
  });

  test.skip('it should be skipped', () => {
    throw new Error('This should never happen');
  });
});

test('describe having only skipped test should not run beforeAll', () => {
  expect(hasBeforeAllRun2).toBe(false);
});

test('describe having only skipped test should not run afterAll', () => {
  expect(hasAfterAllRun2).toBe(false);
});
