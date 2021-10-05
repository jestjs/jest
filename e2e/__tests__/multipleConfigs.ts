/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {wrap} from 'jest-snapshot-serializer-raw';
import runJest from '../runJest';

const MULTIPLE_CONFIGS_ERROR_TEXT = 'Multiple configurations found';

test('multiple configs will throw matching error', () => {
  const rootDir = path.resolve(__dirname, '..', '..');
  const {exitCode, stderr} = runJest('multiple-configs', ['--show-config'], {
    skipPkgJsonCheck: true,
  });

  expect(exitCode).toBe(1);
  expect(stderr).toContain(MULTIPLE_CONFIGS_ERROR_TEXT);

  const cleanStdErr = stderr.replace(new RegExp(rootDir, 'g'), '<rootDir>');
  expect(wrap(cleanStdErr)).toMatchSnapshot();
});

test('multiple configs error can be remove by --config', () => {
  const {exitCode, stderr} = runJest(
    'multiple-configs',
    ['--config', 'jest.config.json'],
    {
      skipPkgJsonCheck: true,
    },
  );

  expect(exitCode).toBe(0);
  expect(stderr).not.toContain(MULTIPLE_CONFIGS_ERROR_TEXT);
});
