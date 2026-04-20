/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {cleanup, extractSummary, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../console-log-output-when-run-in-band');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('prints console.logs when run with forceExit', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      test('banana', () => console.log('Hey'));
    `,
    'package.json': '{}',
  });

  const {stderr, stdout, exitCode} = runJest(DIR, [
    '-i',
    '--ci=false',
    '--forceExit',
  ]);

  const {rest, summary} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(stdout).toMatchSnapshot();
});
