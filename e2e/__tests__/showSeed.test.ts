/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary, replaceSeed} from '../Utils';
import runJest from '../runJest';

test('--showSeed changes report to output seed', () => {
  const dir = path.resolve(__dirname, '../each');

  const {stderr} = runJest(dir, [
    '--showSeed',
    '--no-cache',
    // Make the snapshot flag stable on CI.
    '--ci',
  ]);

  const summary = replaceSeed(extractSummary(stderr).summary);

  expect(summary).toMatchSnapshot();
});

test('if --showSeed is not present the report will not show the seed', () => {
  const dir = path.resolve(__dirname, '../jest-object');

  const {stderr} = runJest(dir, ['--seed', '1234', '--ci']);

  const summary = extractSummary(stderr).summary;

  expect(summary).toMatchSnapshot();
});

test('--seed --showSeed will show the seed in the report', () => {
  const dir = path.resolve(__dirname, '../jest-object');

  const {stderr} = runJest(dir, ['--showSeed', '--seed', '1234', '--ci']);

  const summary = replaceSeed(extractSummary(stderr).summary);

  expect(summary).toMatchSnapshot();
});
