/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const mockFiles = new Map();
function __setMockFiles(newMockFiles) {
  mockFiles.clear();
  Object.keys(newMockFiles).forEach(fileName => {
    mockFiles.set(fileName, newMockFiles[fileName]);
  });
}

function readPkg(file) {
  const mockFile = mockFiles.get(file);
  try {
    const json = JSON.parse(mockFile);
    return Promise.resolve(json);
  } catch (err) {
    return Promise.reject(`${file} is not valid JSON.`);
  }
}

module.exports = readPkg;
module.exports.__setMockFiles = __setMockFiles;
