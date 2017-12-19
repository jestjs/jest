/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const runJest = require('../runJest');

const getLog = result =>
  result.stdout
    .toString()
    .split('\n')[1]
    .trim();

describe('Environment override', () => {
  it('uses jsdom when specified', () => {
    const result = runJest('env-test', ['--env=jsdom']);
    expect(result.status).toBe(0);
    expect(getLog(result)).toBe('WINDOW');
  });

  it('uses node as default from package.json', () => {
    const result = runJest('env-test');
    expect(result.status).toBe(0);
    expect(getLog(result)).toBe('NO WINDOW');
  });

  it('uses node when specified', () => {
    const result = runJest('env-test', ['--env=node']);
    expect(result.status).toBe(0);
    expect(getLog(result)).toBe('NO WINDOW');
  });

  it('fails when the env is not available', () => {
    const result = runJest('env-test', ['--env=banana']);
    expect(result.status).toBe(1);
  });
});
