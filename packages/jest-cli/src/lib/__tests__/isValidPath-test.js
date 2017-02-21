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

/* eslint-disable max-len */

const path = require('path');
const isValidPath = require('../isValidPath');

const rootDir = path.join(path.sep, 'root');

const config = {
  rootDir,
  roots: [path.join(rootDir, 'src'), path.join(rootDir, 'lib')],
};

it('is valid when it is a file inside roots', () => {
  expect(isValidPath(config, path.join(rootDir, 'src', 'index.js'))).toBe(true);
  expect(isValidPath(config, path.join(rootDir, 'src', 'components', 'Link.js'))).toBe(true);
  expect(isValidPath(config, path.join(rootDir, 'src', 'lib', 'something.js'))).toBe(true);
});

it('is not valid when it is a snapshot file', () => {
  expect(isValidPath(config, path.join(rootDir, 'src', 'index.js.snap'))).toBe(false);
  expect(isValidPath(config, path.join(rootDir, 'src', 'components', 'Link.js.snap'))).toBe(false);
  expect(isValidPath(config, path.join(rootDir, 'src', 'lib', 'something.js.snap'))).toBe(false);
});

it('is not valid when it is a file in the coverage dir', () => {
  expect(isValidPath(config, path.join(rootDir, 'coverage', 'lib', 'index.js'))).toBe(false);
  
  const configWithCoverage = Object.assign({}, config, {
    coverageDirectory: 'cov-dir',
  });
  
  expect(isValidPath(configWithCoverage, path.join(rootDir, 'src', 'cov-dir', 'lib', 'index.js')))
    .toBe(false);
});
