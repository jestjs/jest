/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const DIR = path.join(
  os.tmpdir(),
  'jest-global-teardown-and-per-worker-project-2',
);

test('teardown file should not exist', () => {
  expect(fs.existsSync(DIR)).toBe(false);
});
