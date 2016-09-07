/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const runJest = require('../runJest');
const skipOnWindows = require('skipOnWindows');

skipOnWindows.suite();

const dir = path.resolve(__dirname, '../globals');

test('global jest variables', () => {
  const {stderr, status} = runJest(dir);

  expect(status).toBe(0);

  const output = stderr
    .split('\n')
    .slice(0, -2)
    .join('\n')
    .replace(/\s*\(.*ms\)/gm, '');

  expect(output).toMatchSnapshot();
});
