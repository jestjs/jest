/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {skipSuiteOnJasmine} from '@jest/test-utils';
import {extractSummary} from '../Utils';
import runJest, {RunJestResult} from '../runJest';

skipSuiteOnJasmine();

const dir = path.resolve(__dirname, '../randomize');

function runJestTwice(
  dir: string,
  args: Array<string>,
): [RunJestResult, RunJestResult] {
  return [
    runJest(dir, [...args, '--randomize']),
    runJest(dir, [...args, '--config', 'different-config.json']),
  ];
}

test('works with passing tests', () => {
  const [result1, result2] = runJestTwice(dir, [
    'success.test.js',
    '--seed',
    '123',
  ]);

  const rest1 = extractSummary(result1.stderr)
    .rest.split('\n')
    .slice(1)
    .join('\n');
  const rest2 = extractSummary(result2.stderr)
    .rest.split('\n')
    .slice(1)
    .join('\n');
  expect(rest1).toEqual(rest2);
  expect(rest1).toMatchSnapshot();
});

test('works with each', () => {
  const [result1, result2] = runJestTwice(dir, [
    'each.test.js',
    '--seed',
    '123',
  ]);
  const rest1 = extractSummary(result1.stderr)
    .rest.split('\n')
    .slice(1)
    .join('\n');
  const rest2 = extractSummary(result2.stderr)
    .rest.split('\n')
    .slice(1)
    .join('\n');
  expect(rest1).toEqual(rest2);
  expect(rest1).toMatchSnapshot();
});

test('works with hooks', () => {
  const [result1, result2] = runJestTwice(dir, [
    'hooks.test.js',
    '--seed',
    '123',
  ]);

  // Change in formatting could change this one
  const rest1 = extractSummary(result1.stderr)
    .rest.split('\n')
    .slice(1)
    .join('\n');
  const rest2 = extractSummary(result2.stderr)
    .rest.split('\n')
    .slice(1)
    .join('\n');
  expect(rest1).toEqual(rest2);
  expect(rest1).toMatchSnapshot();
});

test('works with snapshots', () => {
  const [result1, result2] = runJestTwice(dir, [
    'snapshots.test.js',
    '--seed',
    '123',
  ]);

  const rest1 = extractSummary(result1.stderr)
    .rest.split('\n')
    .slice(1)
    .join('\n');
  const rest2 = extractSummary(result2.stderr)
    .rest.split('\n')
    .slice(1)
    .join('\n');
  expect(rest1).toEqual(rest2);
  expect(rest1).toMatchSnapshot();
});
