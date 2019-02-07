/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import path from 'path';
import runJest from '../runJest';
import {wrap} from 'jest-snapshot-serializer-raw';

const DIR = path.resolve(__dirname, '../coverage-report');

test('outputs coverage report when text is requested', () => {
  const {stdout, status} = runJest(
    DIR,
    [
      '--no-cache',
      '--coverage',
      '--coverageReporters=text',
      '--coverageReporters=html',
    ],
    {stripAnsi: true},
  );
  expect(status).toBe(0);
  expect(stdout).toMatch(/Stmts | . Branch/);
  expect(wrap(stdout)).toMatchSnapshot();
});

test('outputs coverage report when text-summary is requested', () => {
  const {stdout, status} = runJest(
    DIR,
    ['--no-cache', '--coverage', '--coverageReporters=text-summary'],
    {stripAnsi: true},
  );
  expect(status).toBe(0);
  expect(stdout).toMatch(/Coverage summary/);
  expect(wrap(stdout)).toMatchSnapshot();
});

test('outputs coverage report when text and text-summary is requested', () => {
  const {stdout, status} = runJest(
    DIR,
    [
      '--no-cache',
      '--coverage',
      '--coverageReporters=text-summary',
      '--coverageReporters=text',
    ],
    {stripAnsi: true},
  );
  expect(status).toBe(0);
  expect(stdout).toMatch(/Stmts | . Branch/);
  expect(stdout).toMatch(/Coverage summary/);
  expect(wrap(stdout)).toMatchSnapshot();
});

test('does not output coverage report when html is requested', () => {
  const {stdout, status} = runJest(
    DIR,
    ['--no-cache', '--coverage', '--coverageReporters=html'],
    {stripAnsi: true},
  );
  expect(status).toBe(0);
  expect(stdout).toMatch(/^$/);
  expect(wrap(stdout)).toMatchSnapshot();
});

test('collects coverage from duplicate files avoiding shared cache', () => {
  const args = [
    '--coverage',
    // Ensure the status code is non-zero if super edge case with coverage triggers
    '--coverageThreshold',
    '{"global": {"lines": 100}}',
    '--collectCoverageOnlyFrom',
    'cached-duplicates/a/identical.js',
    '--collectCoverageOnlyFrom',
    'cached-duplicates/b/identical.js',
    '--',
    'identical.test.js',
  ];
  // Run once to prime the cache
  runJest(DIR, args, {stripAnsi: true});

  // Run for the second time
  const {stdout, status} = runJest(DIR, args, {stripAnsi: true});
  expect(wrap(stdout)).toMatchSnapshot();
  expect(status).toBe(0);
});

test('generates coverage when using the testRegex config param ', () => {
  const {stdout, status} = runJest(DIR, [
    '--no-cache',
    '--testRegex=__tests__',
    '--coverage',
  ]);
  expect(wrap(stdout)).toMatchSnapshot();
  expect(status).toBe(0);
});
