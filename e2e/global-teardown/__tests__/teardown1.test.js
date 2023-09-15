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

const DIR = path.join(os.tmpdir(), 'jest-global-teardown');

test('should not exist teardown file', () => {
  const files = fs.readdirSync(DIR);
  expect(files).toHaveLength(0);
});
