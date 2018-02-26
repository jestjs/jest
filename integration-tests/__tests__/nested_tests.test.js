/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const runJest = require('../runJest');

test('runs tests and suites defined inside other tests', () => {
  const result = runJest('nested-tests');
  expect(result.stdout).toMatch('allSuitesCount: 16');
  expect(result.stdout).toMatch('allTestsCount: 152');
  result.stderr.split('\n').forEach(line => {
    // only tests with "failing" in the name should be failing
    if (line.includes('✕ ')) {
      expect(line).toMatch('failing');
    } else if (line.includes('✓ ')) {
      expect(line).not.toMatch('failing');
    }
  });
  const afterAlls = result.stdout
    .split('\n')
    .filter(line => line.includes(' > afterAll'));
  expect(afterAlls).toHaveLength(24);
  expect(result.stderr).toMatch('48 failed, 104 passed, 152 total');
  expect(result.stdout).toMatchSnapshot();
  expect(result.status).toBe(1);
});
