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

const {linkJestPackage} = require('../utils');
const runJest = require('../runJest');
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, '../coverage_report');

beforeEach(() => linkJestPackage('babel-jest', DIR));

it('outputs coverage report', () => {
  const {stdout, status} = runJest(DIR, ['--no-cache', '--coverage']);
  const coverageDir = path.resolve(__dirname, '../coverage_report/coverage');

  // - the `setup.js` file is ignored and should not be in the coverage report.
  // - `sum_dependency.js` is mocked and the real module is never required but
  //  is listed with 0 % coverage.
  // - `not-required-in-test-suite.js` is not required but it is listed
  //  with 0 % coverage.
  expect(stdout).toMatchSnapshot();

  expect(() => fs.accessSync(coverageDir, fs.F_OK)).not.toThrow();
  expect(status).toBe(0);
});

it('collects coverage only from specified files', () => {
  const {stdout} = runJest(DIR, [
    '--no-cache',
    '--coverage',
    '--collectCoverageFrom', // overwrites the one in package.json
    'setup.js',
  ]);

  // Coverage report should only have `setup.js` coverage info
  expect(stdout).toMatchSnapshot();
});
