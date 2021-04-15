/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import os from 'os';
import path from 'path';
import fs from 'graceful-fs';

const DIR = path.join(os.tmpdir(), 'jest-global-teardown-project-1');

test('should not exist teardown file', () => {
  expect(fs.existsSync(DIR)).toBe(false);
});
