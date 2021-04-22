/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import os from 'os';
import path from 'path';
import fs from 'graceful-fs';
import greeting from '../';

const DIR = path.join(os.tmpdir(), 'jest-global-setup-esm');

test('should exist setup file', () => {
  const files = fs.readdirSync(DIR);
  expect(files).toHaveLength(1);
  const setup = fs.readFileSync(path.join(DIR, files[0]), 'utf8');
  expect(setup).toBe('setup');
});
