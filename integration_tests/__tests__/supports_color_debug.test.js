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

const path = require('path');
const fs = require('fs');

test('always passes', () => {
  require('../supports_color');
});

test('resolves to', () => {
  const filePath = require.resolve('supports-color');
  const dirname = path.dirname(filePath);
  const pkgJson = path.resolve(dirname, 'package.json');
  const pkgJsonObject = require(pkgJson);
  console.log(pkgJsonObject);
});
