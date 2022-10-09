/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary, replaceSeed} from '../Utils';
import runJest from '../runJest';

const dir = path.resolve(__dirname, '../jest-object');

test('--showSeed changes report to output seed', () => {
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
  const {stderr} = runJest(dir, ['--seed', '1234', '--ci']);

  const {summary} = extractSummary(stderr);

  expect(summary).toMatchSnapshot();
});

test('if showSeed is present in the config the report will show the seed', () => {
  const {stderr} = runJest(dir, [
    '--seed',
    '1234',
    '--ci',
    '--config',
    'different-config.json',
  ]);

  const {summary} = extractSummary(stderr);

  expect(summary).toMatchSnapshot();
});

test('--seed --showSeed will show the seed in the report', () => {
  const {stderr} = runJest(dir, ['--showSeed', '--seed', '1234', '--ci']);

  const summary = replaceSeed(extractSummary(stderr).summary);

  expect(summary).toMatchSnapshot();
});
