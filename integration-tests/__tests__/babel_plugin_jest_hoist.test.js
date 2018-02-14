/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const path = require('path');
const {run} = require('../Utils');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '..', 'babel-plugin-jest-hoist');

beforeEach(() => {
  run('yarn', DIR);
});

it('sucessfully runs the tests inside `babel-plugin-jest-hoist/`', () => {
  const {json} = runJest.json(DIR, ['--no-cache', '--coverage']);
  expect(json.success).toBe(true);
  expect(json.numTotalTestSuites).toBe(2);
});
