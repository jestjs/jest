/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../v8-coverage');

test('does not explode on missing sourcemap', () => {
  const sourcemapDir = path.join(DIR, 'no-sourcemap');
  const {stderr, status} = runJest(sourcemapDir, ['--v8-coverage'], {
    stripAnsi: true,
  });

  expect(stderr).not.toContain('no such file or directory');
  expect(status).toBe(0);
});
