/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../coverage-report-for-multi-projects');

test('exclude a project\'s code coverage if its collectCoverage is toggled off', () => {
  const {stdout, stderr, exitCode} = runJest(DIR, [
    '--no-cache',
  ]);
  expect(stdout).toMatchSnapshot();
  expect(stderr).toMatchSnapshot();
  expect(exitCode).toBe(0);  
})
