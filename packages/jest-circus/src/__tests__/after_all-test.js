/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

import {runTest} from '../__mocks__/test_utils';

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
