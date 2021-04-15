/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import os from 'os';
import path from 'path';
import fs from 'graceful-fs';

const DIR = path.join(os.tmpdir(), 'jest-global-teardown-project-2');

test('teardown file should not exist', () => {
  expect(fs.existsSync(DIR)).toBe(false);
});
