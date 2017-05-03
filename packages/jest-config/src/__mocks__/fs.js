/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const fs = jest.genMockFromModule('fs');

const mockFiles = new Map();
function __setMockFiles(newMockFiles) {
  mockFiles.clear();
  Object.keys(newMockFiles).forEach(fileName => {
    mockFiles.set(fileName, newMockFiles[fileName]);
  });
}

fs.__setMockFiles = __setMockFiles;
fs.readFileSync = jest.fn(file => mockFiles.get(file));

module.exports = fs;
