/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

const path = require('path');
const runJest = require('../runJest');

describe('jest --debug', () => {
  const dir = path.resolve(__dirname, '..', 'verbose-reporter');

  it('outputs debugging info before running the test', () => {
    const {stdout} = runJest(dir, ['--debug', '--no-cache']);
    expect(stdout).toMatch('"version": "');
    expect(stdout).toMatch('"configs": [');
    // config contains many file paths so we cannot do snapshot test
  });
});
