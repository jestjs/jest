/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const skipOnWindows = require('skipOnWindows');
const {linkJestPackage} = require('../utils');
const runJest = require('../runJest');

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
          .replace(/"cacheDirectory": "(.+)"/g, '"cacheDirectory": "/tmp/jest"')
          .replace(/"name": "(.+)"/g, '"name": "[md5 hash]"')
          .replace(/"version": "(.+)"/g, '"version": "[version]"')
          .replace(new RegExp(root, 'g'), '/mocked/root/path'),
      test: val => typeof val === 'string',
    });
    const {stdout} = runJest(dir, [
      '--showConfig',
      '--no-cache',
      // Make the snapshot flag stable on CI.
      '--updateSnapshot',
    ]);
    expect(stdout).toMatchSnapshot();
  });
});
