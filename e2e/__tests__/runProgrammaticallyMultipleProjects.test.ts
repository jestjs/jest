/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import stripAnsi = require('strip-ansi');
import {extractSummary, run} from '../Utils';

const dir = resolve(__dirname, '../run-programmatically-multiple-projects');

test('run programmatically with multiple projects', () => {
  const {stderr, exitCode} = run('node run-jest.js', dir);
  const {summary} = extractSummary(stripAnsi(stderr));
  expect(exitCode).toBe(0);
  expect(summary).toMatchSnapshot('summary');
});
