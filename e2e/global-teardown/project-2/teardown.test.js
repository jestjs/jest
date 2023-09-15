/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DIR = path.join(os.tmpdir(), 'jest-global-teardown-project-2');

test('teardown file should not exist', () => {
  expect(fs.existsSync(DIR)).toBe(false);
});
