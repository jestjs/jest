/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import runJest from '../runJest';
import os from 'os';
import path from 'path';
const {cleanup, writeFiles} = require('../Utils');

const DIR = path.resolve(os.tmpdir(), 'force_exit_test');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('exits the process after test are done but before timers complete', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/test.test.js': `
      test('finishes before the timer is complete', () => {
        setTimeout(() => console.log('TIMER_DONE'), 500);
      });
    `,
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  let stdout;
  let stderr;
  ({stdout, stderr} = runJest(DIR));
  expect(stderr).toMatch(/PASS.*test\.test\.js/);
  expect(stdout).toMatch(/TIMER_DONE/);
  writeFiles(DIR, {
    'package.json': JSON.stringify({
      jest: {forceExit: true, testEnvironment: 'node'},
    }),
  });

  ({stdout, stderr} = runJest(DIR));
  expect(stderr).toMatch(/PASS.*test\.test\.js/);
  expect(stdout).not.toMatch(/TIMER_DONE/);
});
