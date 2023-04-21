/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {relative, resolve} from 'path';
import type {AggregatedResult} from '@jest/test-result';
import {run} from '../Utils';

const dir = resolve(__dirname, '..', 'run-programmatically');

test('runCLI Jest programmatically cjs', () => {
  const {stdout} = run('node cjs.js --version', dir);
  expect(stdout).toMatch(/\d{2}\.\d{1,2}\.\d{1,2}[-\S]*-dev$/);
});

test('runCLI Jest programmatically esm', () => {
  const {stdout} = run('node index.js --version', dir);
  expect(stdout).toMatch(/\d{2}\.\d{1,2}\.\d{1,2}[-\S]*-dev$/);
});

test('runCore Jest programmatically', () => {
  const {stdout} = run('node core.mjs', dir);
  const {startTime, ...results}: AggregatedResult = JSON.parse(
    stdout.split('==== results ====')[1],
  );

  const prunedResults = {
    ...results,

    testResults: results.testResults.map(
      ({testFilePath, perfStats, ...testFileData}) => ({
        ...testFileData,
        testFilePath: relative(dir, testFilePath),
        testResults: testFileData.testResults.map(
          ({duration, ...testResult}) => testResult,
        ),
      }),
    ),
  };
  expect(prunedResults).toMatchSnapshot();
});
