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

const isValidPath = require('../isValidPath');

const config = {
  rootDir: '/root',
  roots: ['/root/src', '/root/lib'],
};

it('is valid when it is a file inside roots', () => {
  expect(isValidPath(config, '/root/src/index.js')).toBe(true);
  expect(isValidPath(config, '/root/src/components/Link.js')).toBe(true);
  expect(isValidPath(config, '/root/src/lib/something.js')).toBe(true);
});

it('is not valid when it is a snapshot file', () => {
  expect(isValidPath(config, '/root/src/index.js.snap')).toBe(false);
  expect(isValidPath(config, '/root/src/components/Link.js.snap')).toBe(false);
  expect(isValidPath(config, '/root/src/lib/something.js.snap')).toBe(false);
});

it('is not valid when it is a file in the coverage dir', () => {
  expect(isValidPath(config, '/root/coverage/lib/index.js')).toBe(false);
  
  const configWithCoverage = Object.assign({}, config, {
    coverageDirectory: 'cov-dir',
  });
  
  expect(isValidPath(configWithCoverage, '/root/src/cov-dir/lib/index.js'))
    .toBe(false);
});
