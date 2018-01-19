/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const fs = require('fs');
const os = require('os');
const runJest = require('../runJest');
const {cleanup} = require('../utils');

const DIR = os.tmpdir() + '/jest';

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

it('triggers setup/teardown hooks', () => {
  const result = runJest('test-environment-async');
  expect(result.status).toBe(0);
  const teardown = fs.readFileSync(DIR + '/teardown', 'utf8');
  expect(teardown).toBe('teardown');
});
