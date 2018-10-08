/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

import path from 'path';
import {cleanup, extractSummary, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../watch_mode/rogelio');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('works', () => {
  writeFiles(DIR, {
    '__tests__/foo.spec.js': `
      test('foo', () => {
        expect('foo').toBe('foo');
      });
    `,
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });
  const {status, stdout} = runJest(DIR, [
    '--no-watchman',
    // '--watchPlugins',
    // 'rogelio',
  ]);
  expect(stdout).toMatchSnapshot();
  expect(status).toBe(0);
});
