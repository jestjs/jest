/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const skipOnWindows = require('skipOnWindows');
const {run} = require('../utils');
const runJest = require('../runJest');

skipOnWindows.suite();

it('instruments and collects coverage for typescript files', () => {
  const dir = path.resolve(__dirname, '../typescript-coverage');
  run('yarn', dir);
  const {stdout} = runJest(dir, ['--coverage', '--no-cache']);
  expect(stdout).toMatchSnapshot();
});
