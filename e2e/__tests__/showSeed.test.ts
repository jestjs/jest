/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import runJest from '../runJest';
import { extractSummary, replaceSeed } from '../Utils';

test('--showSeed changes report to output seed', () => {
  const dir = path.resolve(__dirname, '../each');

  let {stderr} = runJest(dir, [
    '--showSeed',
    '--no-cache',
    // Make the snapshot flag stable on CI.
    '--ci',
  ]);

  const summary = replaceSeed(extractSummary(stderr).summary);

  expect(summary).toMatchSnapshot();
});

test('--seed will force the report to show the seed in the report', () => {
  const dir = path.resolve(__dirname, '../jest-object');

  let {stderr} = runJest(dir, [
    '--seed',
    '1234',
    '--ci',
  ]);

  const summary = replaceSeed(extractSummary(stderr).summary);

  expect(summary).toMatchSnapshot();
});

test('--seed --showSeed will show the seed in the report', () => {
  const dir = path.resolve(__dirname, '../jest-object');

  let {stderr} = runJest(dir, [
    '--showSeed',
    '--seed',
    '1234',
    '--ci',
  ]);

  const summary = replaceSeed(extractSummary(stderr).summary);

  expect(summary).toMatchSnapshot();
});
