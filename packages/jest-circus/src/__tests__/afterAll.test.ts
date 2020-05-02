/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import wrap from 'jest-snapshot-serializer-raw';
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

  expect(wrap(result.stdout)).toMatchSnapshot();
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
  expect(wrap(result.stdout)).toMatchSnapshot();
});
