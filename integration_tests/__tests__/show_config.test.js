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
const skipOnWindows = require('../../scripts/skip_on_windows');
const runJest = require('../runJest');
const os = require('os');
const {cleanup, writeFiles} = require('../utils');

skipOnWindows.suite();
const DIR = path.resolve(os.tmpdir(), 'show_config_test');

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
    .replace(/\"\S*show_config_test/gm, '"<<REPLACED_ROOT_DIR>>')
    .replace(/\"\S*\/jest\/packages/gm, '"<<REPLACED_JEST_PACKAGES_DIR>>');

  expect(stdout).toMatchSnapshot();
});
