/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {run} from '../Utils';

const dir = resolve(__dirname, '..', 'runcli-multiple-projects');

test('runcli programmatically with multiple projects', () => {
  const {stdout} = run(`node run-jest.js `, dir);
  expect(stdout).toMatch(/2 passed/);
});

