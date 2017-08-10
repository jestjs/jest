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

const runJest = require('../runJest');
const path = require('path');

const testRootDir = path.resolve(__dirname, '..', '..');
expect.addSnapshotSerializer({
  print: val => val.replace(new RegExp(testRootDir, 'g'), '/MOCK_ABOLUTE_PATH'),
  test: val => typeof val === 'string' && val.includes(testRootDir),
});

describe('--listTests flag', () => {
  it('causes tests to be printed in different lines', () => {
    const {status, stdout} = runJest('list_tests', ['--listTests']);

    expect(status).toBe(0);
    expect(stdout.split('\n').sort().join('\n')).toMatchSnapshot();
  });

  it('causes tests to be printed out as JSON when using the --json flag', () => {
    const {status, stderr} = runJest('list_tests', ['--listTests', '--json']);

    expect(status).toBe(0);
    expect(() => JSON.parse(stderr)).not.toThrow();
    expect(JSON.stringify(JSON.parse(stderr).sort())).toMatchSnapshot();
  });
});
