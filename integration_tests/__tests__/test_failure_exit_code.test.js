/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const path = require('path');
const os = require('os');
const skipOnWindows = require('../../scripts/skip_on_windows');
const {cleanup, writeFiles} = require('../utils');
const runJest = require('../runJest');

const DIR = path.resolve(os.tmpdir(), 'test_failure_exit_code_test');

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('exits with a specified code when test fail', () => {
  writeFiles(DIR, {
    '__tests__/test.test.js': `test('test', () => { expect(1).toBe(2); });`,
    'package.json': JSON.stringify({
      jest: {testEnvironment: 'node', testFailureExitCode: 99},
    }),
  });

  let {status} = runJest(DIR);
  expect(status).toBe(99);

  ({status} = runJest(DIR, ['--testFailureExitCode', '77']));
  expect(status).toBe(77);

  writeFiles(DIR, {
    '__tests__/test.test.js': `test('test', () => { expect(1).toBe(2); });`,
    'package.json': JSON.stringify({
      jest: {testEnvironment: 'node'},
    }),
  });
  ({status} = runJest(DIR));
  expect(status).toBe(1);
});
