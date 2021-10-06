/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import slash = require('slash');
import {extractSummary} from '../Utils';
import runJest from '../runJest';

const MULTIPLE_CONFIGS_WARNING_TEXT = 'Multiple configurations found';

test('multiple configs will warn', () => {
  const rootDir = slash(path.resolve(__dirname, '../..'));
  const {exitCode, stderr} = runJest('multiple-configs', [], {
    skipPkgJsonCheck: true,
  });

  expect(exitCode).toBe(0);
  expect(stderr).toContain(MULTIPLE_CONFIGS_WARNING_TEXT);

  const cleanStdErr = stderr.replace(new RegExp(rootDir, 'g'), '<rootDir>');
  const {rest, summary} = extractSummary(cleanStdErr);

  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('multiple configs warning can be suppressed by using --config', () => {
  const {exitCode, stderr} = runJest(
    'multiple-configs',
    ['--config', 'jest.config.json'],
    {
      skipPkgJsonCheck: true,
    },
  );

  expect(exitCode).toBe(0);
  expect(stderr).not.toContain(MULTIPLE_CONFIGS_WARNING_TEXT);
});
