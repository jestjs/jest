/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

const {stripJestVersion} = require('../utils');
const runJest = require('../runJest');
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, '../coverage_report');

it('outputs coverage report', () => {
  const {stdout, status} = runJest(DIR, ['--coverage']);
  const coverageDir = path.resolve(__dirname, '../coverage_report/coverage');

  // should be no `setup.file` in the coverage report. It's ignored
  expect(stripJestVersion(stdout)).toMatchSnapshot();

  expect(() => fs.accessSync(coverageDir, fs.F_OK)).not.toThrow();
  expect(status).toBe(0);
});

it('collects coverage only from specified files', () => {
  const {stdout} = runJest(DIR, [
    '--coverage',
    '--collectCoverageFrom', // overwrites the one in package.json
    'setup.js',
  ]);

  // Coverage report should only have `setup.js` coverage info
  expect(stripJestVersion(stdout)).toMatchSnapshot();
});
