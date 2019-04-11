/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {runTest} from '../__mocks__/testUtils';

describe('error throwing', () => {
  test(`doesn't throw an error with valid arguments`, () => {
    expect(runTest(`test('test1', () => {});`).stderr).toEqual('');
  });

  test(`throws error with missing callback function`, () => {
    expect(runTest(`test('test2');`).stderr).toContain(
      'Missing second argument. It must be a callback function. Perhaps you want to use `test.todo` for a test placeholder.',
    );
  });

  test(`throws an error when first argument isn't a string`, () => {
    expect(runTest(`test(() => {});`).stderr).toContain(
      'Invalid first argument, () => {}. It must be a string.',
    );
  });

  test(`throws an error when callback function is not a function`, () => {
    expect(runTest(`test('test4', 'test4b');`).stderr).toContain(
      'Invalid second argument, test4b. It must be a callback function.',
    );
  });

  test(`doesn't throw an error with valid arguments`, () => {
    expect(runTest(`test('test4', 'test4b');`).stderr).toContain(
      'Invalid second argument, test4b. It must be a callback function.',
    );
  });
});
