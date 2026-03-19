/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


import {runTest} from '../__mocks__/testUtils';

test('handles plain object throw without crashing', () => {
  const code = `
    test('plain object error', () => {
      throw {status: 403, message: 'Forbidden'};
    });
  `;

  const {stdout, stderr} = runTest(code);

  expect(stderr).toContain('Forbidden');
});
