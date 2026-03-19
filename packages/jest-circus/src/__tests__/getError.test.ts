/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


import {runTest} from '../__mocks__/testUtils';

test('handles plain object error with undefined asyncError', () => {
  const code = `
    test('throws plain object', () => {
      throw {status: 403, message: 'Forbidden'};
    });
  `;

  const {stderr} = runTest(code);

  expect(stderr).toContain('Forbidden');
});
