/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {run} from '../Utils';

const dir = resolve(__dirname, '..', 'run-programmatically');

test('run Jest programmatically cjs', () => {
  const {stdout} = run('node cjs.js --version', dir);
  expect(stdout).toMatch(/\d{2}(?:\.\d{1,2}){2}\S*-dev$/);
});

test('run Jest programmatically esm', () => {
  const {stdout} = run('node index.js --version', dir);
  expect(stdout).toMatch(/\d{2}(?:\.\d{1,2}){2}\S*-dev$/);
});
