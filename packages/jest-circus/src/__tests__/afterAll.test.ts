/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {runTest} from '../__mocks__/testUtils';

test('tests are not marked done until their parent afterAll runs', () => {
  const {stdout} = runTest(`
    describe('describe', () => {
      afterAll(() => {});
      test('one', () => {});
      test('two', () => {});
      describe('2nd level describe', () => {
        afterAll(() => {});
        test('2nd level test', () => {});

        describe('3rd level describe', () => {
          test('3rd level test', () => {});
          test('3rd level test#2', () => {});
        });
      });
    })

    describe('2nd describe', () => {
      afterAll(() => { throw new Error('alabama'); });
      test('2nd describe test', () => {});
    })
  `);

  expect(stdout).toMatchSnapshot();
});

test('describe block cannot have hooks and no tests', () => {
  const result = runTest(`
    describe('describe', () => {
      afterEach(() => {});
      beforeEach(() => {});
      afterAll(() => {});
      beforeAll(() => {});
    })
  `);

  expect(result.stdout).toMatchSnapshot();
});

test('describe block _can_ have hooks if a child describe block has tests', () => {
  const result = runTest(`
    describe('describe', () => {
      afterEach(() => console.log('> afterEach'));
      beforeEach(() => console.log('> beforeEach'));
      afterAll(() => console.log('> afterAll'));
      beforeAll(() => console.log('> beforeAll'));
      describe('child describe', () => {
        test('my test', () => console.log('> my test'));
      })
    })
  `);
  expect(result.stdout).toMatchSnapshot();
});

test('describe block hooks must not run if describe block is skipped', () => {
  const result = runTest(`
    describe.skip('describe', () => {
      afterAll(() => console.log('> afterAll'));
      beforeAll(() => console.log('> beforeAll'));
      test('my test', () => console.log('> my test'));
    })
  `);
  expect(result.stdout).toMatchSnapshot();
});

test('child tests marked with todo should not run if describe block is skipped', () => {
  const result = runTest(`
    describe.skip('describe', () => {
      afterAll(() => console.log('> afterAll'));
      beforeAll(() => console.log('> beforeAll'));
      test.todo('my test');
    })
  `);
  expect(result.stdout).toMatchSnapshot();
});

test('child tests marked with only should not run if describe block is skipped', () => {
  const result = runTest(`
    describe.skip('describe', () => {
      afterAll(() => console.log('> afterAll'));
      beforeAll(() => console.log('> beforeAll'));
      test.only('my test', () => console.log('> my test'));
    })
  `);
  expect(result.stdout).toMatchSnapshot();
});
