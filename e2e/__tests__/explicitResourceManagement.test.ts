/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {runYarnInstall} from '../Utils';
import runJest from '../runJest';

const DIR = resolve(__dirname, '../explicit-resource-management');

beforeAll(() => {
  runYarnInstall(DIR);
});

test('Explicit resource management is supported', () => {
  const result = runJest(DIR);
  expect(result.exitCode).toBe(0);
});
