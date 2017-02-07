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

const MOCKS_PATTERN = path.sep + '__mocks__' + path.sep;

const getMockName = (filePath: string) => {
  const mockPath = filePath.split(MOCKS_PATTERN)[1];
  return mockPath.substring(0, mockPath.lastIndexOf(path.extname(mockPath)));
};

module.exports = getMockName;
