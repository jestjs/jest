/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {skipSuiteOnJasmine} from '@jest/test-utils';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

skipSuiteOnJasmine();

const dir = path.resolve(__dirname, '../randomize');

test('works with passing tests', () => {
  const result = runJest(dir, [
    'success.test.js',
    '--randomize',
    '--seed',
    '123',
  ]);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('works with each', () => {
  const result = runJest(dir, ['each.test.js', '--randomize', '--seed', '123']);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('works with hooks', () => {
  const result = runJest(dir, [
    'hooks.test.js',
    '--randomize',
    '--seed',
    '123',
  ]);
  // Change in formatting could change this one
  expect(result.stdout).toMatchSnapshot();
});

test('works with snapshots', () => {
  const result = runJest(dir, [
    'snapshots.test.js',
    '--randomize',
    '--seed',
    '123',
  ]);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});
