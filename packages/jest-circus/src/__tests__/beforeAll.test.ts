/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {runTest} from '../__mocks__/testUtils';

test('all tests skipped when beforeAll fails', () => {
  const {stdout} = runTest(`
    describe('test that a 3rd party API remains consistent', () => {
      beforeAll(() => expect('login').toBe('successful'));
      test('API function 1', () => expect(1).toBe(1));
      test('API function 2', () => expect(2).toBe(2));
      test('API function 3', () => expect(3).toBe(3));
    });
  `);

  expect(stdout).toMatchSnapshot();
});
