/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

const {linkJestPackage, run} = require('../utils');
const path = require('path');
const runJest = require('../runJest');
const skipOnWindows = require('jest-util/build/skipOnWindows');

const DIR = path.resolve(__dirname, '..', 'babel-plugin-jest-hoist');

skipOnWindows.suite();

if (process.platform !== 'win32') {
  beforeEach(() => {
    run('npm i', DIR);
    linkJestPackage('babel-plugin-jest-hoist', DIR);
    linkJestPackage('babel-jest', DIR);
  });
}

it('sucessfully runs the tests inside `babel-plugin-jest-hoist/`', () => {
  const {json} = runJest.json(DIR, ['--no-cache']);
  expect(json.success).toBe(true);
  expect(json.numTotalTestSuites).toBe(2);
});
