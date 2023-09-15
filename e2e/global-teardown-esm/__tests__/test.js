/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'node:os';
import * as path from 'node:path';
import fs from 'graceful-fs';
import greeting from '../';

const DIR = path.join(os.tmpdir(), 'jest-global-teardown-esm');

test('should not exist teardown file', () => {
  expect(fs.existsSync(DIR)).toBe(false);
});
