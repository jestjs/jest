/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {run} from '../Utils';

const dir = resolve(__dirname, '../run-programmatically-multiple-projects');

test('run programmatically with multiple projects', () => {
  const {stdout, exitCode} = run(`node run-jest.js `, dir);
  expect(exitCode).toEqual(0);
  expect(stdout).toMatch(/Done/);
});
