/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import runJest from '../runJest';
import {cleanup, writeFiles} from '../utils';
import os from 'os';
import path from 'path';

const skipOnWindows = require('../../scripts/skip_on_windows');
const DIR = path.resolve(os.tmpdir(), 'find_related_tests_test');

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('runs tests related to filename', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/test.test.js': `
      const a = require('../a');
      test('a', () => {});
    `,
    'a.js': 'module.exports = {};',
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  const {stdout} = runJest(DIR, ['a.js']);
  expect(stdout).toMatch(/no tests found/i);

  const {stderr} = runJest(DIR, ['--findRelatedTests', 'a.js']);
  expect(stderr).toMatch('PASS  __tests__/test.test.js');

  const summaryMsg = 'Ran all test suites related to files matching /a.js/i.';
  expect(stderr).toMatch(summaryMsg);
});
