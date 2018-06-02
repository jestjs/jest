/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {extractSummary} = require('../Utils');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../coverage-report');

test('outputs coverage report', () => {
  const {stdout, status} = runJest(DIR, ['--no-cache', '--coverage']);
  const coverageDir = path.resolve(__dirname, '../coverage-report/coverage');

  // - the `setup.js` file is ignored and should not be in the coverage report.
  // - `SumDependency.js` is mocked and the real module is never required but
  //  is listed with 0 % coverage.
  // - `notRequiredInTestSuite.js` is not required but it is listed
  //  with 0 % coverage.
  expect(stdout).toMatchSnapshot();

  expect(() => fs.accessSync(coverageDir, fs.F_OK)).not.toThrow();
  expect(status).toBe(0);
});

test('collects coverage only from specified file', () => {
  const {stdout} = runJest(DIR, [
    '--no-cache',
    '--coverage',
    '--collectCoverageFrom', // overwrites the one in package.json
    'setup.js',
  ]);

  // Coverage report should only have `setup.js` coverage info
  expect(stdout).toMatchSnapshot();
});

test('collects coverage only from multiple specified files', () => {
  const {stdout} = runJest(DIR, [
    '--no-cache',
    '--coverage',
    '--collectCoverageFrom',
    'setup.js',
    '--collectCoverageFrom',
    'OtherFile.js',
  ]);

  expect(stdout).toMatchSnapshot();
});

test('collects coverage only from specified files avoiding dependencies', () => {
  const {stdout} = runJest(DIR, [
    '--no-cache',
    '--coverage',
    '--collectCoverageOnlyFrom',
    'Sum.js',
    '--',
    'Sum.test.js',
  ]);

  // Coverage report should only have `sum.js` coverage info
  expect(stdout).toMatchSnapshot();
});

test('json reporter printing with --coverage', () => {
  const {stderr, status} = runJest('json-reporter', ['--coverage']);
  const {summary} = extractSummary(stderr);
  expect(status).toBe(1);
  expect(summary).toMatchSnapshot();
});

test('outputs coverage report as json', () => {
  const {stdout, status} = runJest(DIR, ['--no-cache', '--coverage', '--json']);
  expect(status).toBe(0);

  try {
    JSON.parse(stdout);
  } catch (err) {
    throw new Error(
      "Can't parse the JSON result from stdout. " + err.toString(),
    );
  }
});

test('collects coverage from duplicate files avoiding shared cache', () => {
  const args = [
    '--coverage',
    // Ensure the status code is non-zero if super edge case with coverage triggers
    '--coverageThreshold',
    '{"global": {"lines": 100}}',
    '--collectCoverageOnlyFrom',
    'cached-duplicates/a/Identical.js',
    '--collectCoverageOnlyFrom',
    'cached-duplicates/b/Identical.js',
    '--',
    'Identical.test.js',
  ];
  // Run once to prime the cache
  runJest(DIR, args);

  // Run for the second time
  const {stdout, status} = runJest(DIR, args);
  expect(stdout).toMatchSnapshot();
  expect(status).toBe(0);
});
