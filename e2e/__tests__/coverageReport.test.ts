/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {extractSummary, runYarnInstall} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../coverage-report');

beforeAll(() => {
  runYarnInstall(DIR);
});

test('outputs coverage report', () => {
  const {stdout, exitCode} = runJest(DIR, ['--no-cache', '--coverage'], {
    stripAnsi: true,
  });
  const coverageDir = path.join(DIR, 'coverage');

  // - the `setup.js` file is ignored and should not be in the coverage report.
  // - `SumDependency.js` is mocked and the real module is never required but
  //  is listed with 0 % coverage.
  // - `notRequiredInTestSuite.js` is not required but it is listed
  //  with 0 % coverage.
  expect(stdout).toMatchSnapshot();

  expect(() => fs.accessSync(coverageDir, fs.constants.F_OK)).not.toThrow();
  expect(exitCode).toBe(0);
});

test('collects coverage only from specified file', () => {
  const {stdout} = runJest(
    DIR,
    [
      '--no-cache',
      '--coverage',
      '--collectCoverageFrom', // overwrites the one in package.json
      'file.js',
    ],
    {stripAnsi: true},
  );

  // Coverage report should only have `file.js` coverage info
  expect(stdout).toMatchSnapshot();
});

test('collects coverage only from multiple specified files', () => {
  const {stdout} = runJest(
    DIR,
    [
      '--no-cache',
      '--coverage',
      '--collectCoverageFrom',
      'file.js',
      '--collectCoverageFrom',
      'otherFile.js',
    ],
    {stripAnsi: true},
  );

  expect(stdout).toMatchSnapshot();
});

test('collects coverage only from specified files avoiding dependencies', () => {
  const {stdout} = runJest(
    DIR,
    [
      '--no-cache',
      '--coverage',
      '--collectCoverageFrom',
      'sum.js',
      '--',
      'sum.test.js',
    ],
    {stripAnsi: true},
  );

  // Coverage report should only have `sum.js` coverage info
  expect(stdout).toMatchSnapshot();
});

test('json reporter printing with --coverage', () => {
  const {stderr, exitCode} = runJest('json-reporter', ['--coverage'], {
    stripAnsi: true,
  });
  const {summary} = extractSummary(stderr);
  expect(exitCode).toBe(1);
  expect(summary).toMatchSnapshot();
});

test('outputs coverage report as json', () => {
  const {stdout, exitCode} = runJest(
    DIR,
    ['--no-cache', '--coverage', '--json'],
    {stripAnsi: true},
  );
  expect(exitCode).toBe(0);
  expect(() => JSON.parse(stdout)).not.toThrow();
});

test('outputs coverage report when text is requested', () => {
  const {stdout, exitCode} = runJest(
    DIR,
    [
      '--no-cache',
      '--coverage',
      '--coverageReporters=text',
      '--coverageReporters=html',
    ],
    {stripAnsi: true},
  );
  expect(exitCode).toBe(0);
  expect(stdout).toMatch(/Stmts | . Branch/);
  expect(stdout).toMatchSnapshot();
});

test('outputs coverage report when text-summary is requested', () => {
  const {stdout, exitCode} = runJest(
    DIR,
    ['--no-cache', '--coverage', '--coverageReporters=text-summary'],
    {stripAnsi: true},
  );
  expect(exitCode).toBe(0);
  expect(stdout).toMatch(/Coverage summary/);
  expect(stdout).toMatchSnapshot();
});

test('outputs coverage report when text and text-summary is requested', () => {
  const {stdout, exitCode} = runJest(
    DIR,
    [
      '--no-cache',
      '--coverage',
      '--coverageReporters=text-summary',
      '--coverageReporters=text',
    ],
    {stripAnsi: true},
  );
  expect(exitCode).toBe(0);
  expect(stdout).toMatch(/Stmts | . Branch/);
  expect(stdout).toMatch(/Coverage summary/);
  expect(stdout).toMatchSnapshot();
});

test('does not output coverage report when html is requested', () => {
  const {stdout, exitCode} = runJest(
    DIR,
    ['--no-cache', '--coverage', '--coverageReporters=html'],
    {stripAnsi: true},
  );
  expect(exitCode).toBe(0);
  expect(stdout).toMatch(/^$/);
  expect(stdout).toMatchSnapshot();
});

test('collects coverage from duplicate files avoiding shared cache', () => {
  const args = [
    '--coverage',
    // Ensure the exitCode is non-zero if super edge case with coverage triggers
    '--coverageThreshold',
    '{"global": {"lines": 100}}',
    '--collectCoverageFrom',
    'cached-duplicates/a/identical.js',
    '--collectCoverageFrom',
    'cached-duplicates/b/identical.js',
    '--',
    'identical.test.js',
  ];
  // Run once to prime the cache
  runJest(DIR, args, {stripAnsi: true});

  // Run for the second time
  const {stdout, exitCode} = runJest(DIR, args, {stripAnsi: true});
  expect(stdout).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test('generates coverage when using the testRegex config param ', () => {
  const {stdout, exitCode} = runJest(DIR, [
    '--no-cache',
    '--testRegex=__tests__',
    '--coverage',
  ]);
  expect(stdout).toMatchSnapshot();
  expect(exitCode).toBe(0);
});

test('outputs coverage report with projects option', () => {
  const projectDir = path.resolve(__dirname, '../coverage-with-projects');
  const {stdout, exitCode} = runJest(projectDir, ['--no-cache', '--coverage'], {
    stripAnsi: true,
  });

  expect(stdout).toMatchSnapshot();
  expect(exitCode).toBe(0);
});
