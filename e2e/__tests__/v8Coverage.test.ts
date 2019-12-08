/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {wrap} from 'jest-snapshot-serializer-raw';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../v8-coverage');

test('does not explode on missing sourcemap', () => {
  const sourcemapDir = path.join(DIR, 'no-sourcemap');
  const {stdout, exitCode} = runJest(sourcemapDir, ['--v8-coverage'], {
    stripAnsi: true,
  });

  expect(exitCode).toBe(0);
  expect(wrap(stdout)).toMatchSnapshot();
});
