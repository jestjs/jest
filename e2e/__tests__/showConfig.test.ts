/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {tmpdir} from 'os';
import {wrap} from 'jest-snapshot-serializer-raw';
import {skipSuiteOnWindows} from '@jest/test-utils';
import runJest from '../runJest';
import {cleanup, writeFiles} from '../Utils';

skipSuiteOnWindows();

const DIR = path.resolve(tmpdir(), 'show-config-test');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('--showConfig outputs config info and exits', () => {
  writeFiles(DIR, {
    '__tests__/test.test.js': `test('test', () => {});`,
    'package.json': JSON.stringify({jest: {environment: 'node'}}),
  });

  let {stdout} = runJest(DIR, [
    '--showConfig',
    '--no-cache',
    // Make the snapshot flag stable on CI.
    '--updateSnapshot',
  ]);

  stdout = stdout
    .replace(/"cacheDirectory": "(.+)"/g, '"cacheDirectory": "/tmp/jest"')
    .replace(/"name": "(.+)"/g, '"name": "[md5 hash]"')
    .replace(/"version": "(.+)"/g, '"version": "[version]"')
    .replace(/"maxWorkers": (\d+)/g, '"maxWorkers": "[maxWorkers]"')
    .replace(/"\S*show-config-test/gm, '"<<REPLACED_ROOT_DIR>>')
    .replace(/"\S*\/jest\/packages/gm, '"<<REPLACED_JEST_PACKAGES_DIR>>');

  expect(wrap(stdout)).toMatchSnapshot();
});
