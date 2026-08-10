/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {runYarnInstall} from '../Utils';
import runJest from '../runJest';

it('processes stack traces and code frames with source maps', () => {
  const dir = path.resolve(__dirname, '../stack-trace-source-maps');
  runYarnInstall(dir);
  const {stderr} = runJest(dir, ['--no-cache']);
  expect(stderr).toMatch('> 15 |   (() => expect(false).toBe(true))();');
  expect(stderr).toMatch(`at __tests__/fails.ts:15:24
      at Object.<anonymous> (__tests__/fails.ts:15:35)`);
});
