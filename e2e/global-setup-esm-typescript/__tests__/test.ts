/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'node:os';
import * as path from 'node:path';
/* eslint-disable import-x/default */
import fs from 'graceful-fs';
/* eslint-enable import-x/default */

const DIR = path.join(os.tmpdir(), 'jest-global-setup-esm-typescript');

test('globalSetup ran as an ES module', () => {
  const fileURL = fs.readFileSync(path.join(DIR, 'setup.txt'), 'utf8');

  expect(fileURL).toMatch(
    /^file:\/\/.*\/global-setup-esm-typescript\/setup\.ts$/,
  );
});
