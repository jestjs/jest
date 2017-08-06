/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import runJest from '../runJest';
import {cleanup, writeFiles} from '../utils';
import os from 'os';
import path from 'path';

const skipOnWindows = require('../../scripts/skip_on_windows');
const DIR = path.resolve(os.tmpdir(), 'force_exit_test');

skipOnWindows.suite();

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
