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

const DIR = path.join(os.tmpdir(), 'jest-global-teardown-per-worker');

test('should not exist teardown file', () => {
  const files = fs.readdirSync(DIR);
  expect(files).toHaveLength(0);
});
