/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {runTest} from '../__mocks__/testUtils';

test('simple test', () => {
  const {stdout} = runTest(`
    describe('describe', () => {
      beforeEach(() => {});
      afterEach(() => {});
      test('one', () => {});
      test('two', () => {});
    })
  `);

  expect(stdout).toMatchSnapshot();
});

test('function descriptors', () => {
  const {stdout} = runTest(`
    describe(function describer() {}, () => {
      test(class One {}, () => {});
    })
  `);

  expect(stdout).toMatchSnapshot();
});

test('failures', () => {
  const {stdout} = runTest(`
    describe('describe', () => {
      beforeEach(() => {});
      afterEach(() => { throw new Error('banana')});
      test('one', () => { throw new Error('kentucky')});
      test('two', () => {});
    })
  `);

  expect(stdout).toMatchSnapshot();
});
