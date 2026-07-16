/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {runYarnInstall} from '../Utils';
import {json as runWithJson} from '../runJest';

const DIR = path.resolve(__dirname, '..', 'babel-plugin-jest-hoist');

beforeEach(() => {
  runYarnInstall(DIR);
});

it('successfully runs the tests inside `babel-plugin-jest-hoist/`', () => {
  const {json} = runWithJson(DIR, ['--no-cache', '--coverage']);
  expect(json.success).toBe(true);
  expect(json.numTotalTestSuites).toBe(4);
});
