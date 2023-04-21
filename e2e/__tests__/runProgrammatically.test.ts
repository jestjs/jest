/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import stripAnsi = require('strip-ansi');
import {extractSummary, run} from '../Utils';

const dir = resolve(__dirname, '..', 'run-programmatically');

test('runCLI Jest programmatically cjs', () => {
  const {stdout} = run('node cjs.js --version', dir);
  expect(stdout).toMatch(/\d{2}\.\d{1,2}\.\d{1,2}[-\S]*-dev$/);
});

test('runCLI Jest programmatically esm', () => {
  const {stdout} = run('node index.js --version', dir);
  expect(stdout).toMatch(/\d{2}\.\d{1,2}\.\d{1,2}[-\S]*-dev$/);
});

test('runCore Jest programmatically', () => {
  const {stderr, stdout} = run('node core.mjs', dir);
  const {summary} = extractSummary(stripAnsi(stderr));

  expect(summary).toMatchSnapshot('summary');
  expect(stdout).toMatchSnapshot('stdout');
});
