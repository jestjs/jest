/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import runJest from '../runJest';
import os from 'os';
import path from 'path';
import {cleanup, writeFiles} from '../Utils';

const DIR = path.resolve(os.tmpdir(), 'force-exit-test');

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

  let stderr;
  ({stderr} = runJest(DIR));
  expect(stderr).toMatch(/PASS.*test\.test\.js/);
  expect(stderr).toMatch(/TIMER_DONE/);
  writeFiles(DIR, {
    'package.json': JSON.stringify({
      jest: {forceExit: true, testEnvironment: 'node'},
    }),
  });

  ({stderr} = runJest(DIR));
  expect(stderr).toMatch(/PASS.*test\.test\.js/);
  expect(stderr).not.toMatch(/TIMER_DONE/);
});
