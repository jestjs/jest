/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('prints useful error for environment methods after test is done', () => {
  const {stderr} = runJest('environment-after-teardown');
  const interestingLines = stderr.split('\n').slice(9, 18).join('\n');

  expect(interestingLines).toMatchSnapshot();
  expect(stderr.split('\n')[9]).toBe(
    'ReferenceError: You are trying to access a property or method of the Jest environment after it has been torn down. From __tests__/afterTeardown.test.js.',
  );
});
