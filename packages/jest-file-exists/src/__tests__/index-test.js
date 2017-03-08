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

const fileExists = require('../');
const path = require('path');

test('file exists', () => {
  expect(fileExists(__filename)).toBe(true);
});

test('file exists if module map is provided', () => {
  expect(
    fileExists('/random-string.js', {
      exists: filePath => filePath === '/random-string.js',
    }),
  ).toBe(true);
});

test('file does not exist', () => {
  expect(
    fileExists(
      path.join(path.basename(__filename), 'does-probably-not-exist.js'),
      {
        exists: filePath => filePath === '/random-string.js',
      },
    ),
  ).toBe(false);
});
