/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import runJest from '../runJest';

test('multiple configs will throw matching error', () => {
  const rootDir = path.resolve(__dirname, '..', 'multiple-configs');
  const {exitCode, stderr} = runJest(rootDir, ['--show-config'], {
    skipPkgJsonCheck: true,
  });

  expect(exitCode).not.toBe(0);
  expect(
    stderr.replace(new RegExp(rootDir, 'g'), '<rootDir>'),
  ).toMatchSnapshot();
});
