/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {skipSuiteOnWindows} from '@jest/test-utils';
import {json as runWithJson} from '../runJest';
import {run} from '../Utils';

const DIR = path.resolve(__dirname, '..', 'pnp');

// https://github.com/facebook/jest/pull/8094#issuecomment-471220694
skipSuiteOnWindows();

beforeEach(() => {
  run('yarn', DIR);
});

it('successfully runs the tests inside `pnp/`', () => {
  const {json} = runWithJson(DIR, ['--no-cache', '--coverage'], {
    nodeOptions: `--require ${DIR}/.pnp.js`,
  });
  expect(json.success).toBe(true);
  expect(json.numTotalTestSuites).toBe(2);
});
