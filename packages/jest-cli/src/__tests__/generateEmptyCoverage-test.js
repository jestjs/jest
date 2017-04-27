/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

const os = require('os');

const generateEmptyCoverage = require('../generateEmptyCoverage');

jest.mock('jest-runtime', () => {
  const realRuntime = require.requireActual('jest-runtime');
  realRuntime.shouldInstrument = () => true;
  return realRuntime;
});

const src = `
throw new Error('this should not be thrown');

const a = (b, c) => {
  if (b) {
    return c;
  } else {
    return b;
  }
};

module.exports = {
  a,
};`;

it('generates an empty coverage object for a file without running it', () => {
  expect(
    generateEmptyCoverage(
      src,
      '/sum.js',
      {},
      {
        cacheDirectory: os.tmpdir(),
        rootDir: os.tmpdir(),
      },
    ).coverage,
  ).toMatchSnapshot();
});
