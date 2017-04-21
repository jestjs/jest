/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const {linkJestPackage} = require('../utils');
const path = require('path');
const runJest = require('../runJest');
const skipOnWindows = require('skipOnWindows');

describe('jest --showConfig', () => {
  skipOnWindows.suite();

  const dir = path.resolve(__dirname, '..', 'verbose_reporter');

  beforeEach(() => {
    if (process.platform !== 'win32') {
      linkJestPackage('babel-jest', dir);
    }
  });

  it('outputs config info and exits', () => {
    const root = path.join(__dirname, '..', '..', '..');
    expect.addSnapshotSerializer({
      print: val =>
        val
          .replace(new RegExp(root, 'g'), '/mocked/root/path')
          .replace(/"name": "(.+)"/, '"name": "[md5 hash]"')
          .replace(/"cacheDirectory": "(.+)"/, '"cacheDirectory": "/tmp/jest"'),
      test: val => typeof val === 'string',
    });
    const {stdout} = runJest(dir, ['--showConfig', '--no-cache']);
    expect(stdout).toMatchSnapshot();
  });
});
