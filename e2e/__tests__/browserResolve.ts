/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {runYarnInstall} from '../Utils';
import runJest from '../runJest';

test('browser resolver works', () => {
  const dir = path.resolve(__dirname, '../browser-resolver');
  runYarnInstall(dir);

  const {exitCode} = runJest('browser-resolver');

  expect(exitCode).toBe(0);
});
