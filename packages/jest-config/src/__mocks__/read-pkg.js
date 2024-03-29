/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const mockFiles = new Map();
function __setMockFiles(newMockFiles) {
  mockFiles.clear();
  for (const fileName of Object.keys(newMockFiles)) {
    mockFiles.set(fileName, newMockFiles[fileName]);
  }
}

function readPkg(file) {
  const mockFile = mockFiles.get(file);
  try {
    const json = JSON.parse(mockFile);
    return Promise.resolve(json);
  } catch {
    return Promise.reject(`${file} is not valid JSON.`);
  }
}

module.exports = readPkg;
module.exports.__setMockFiles = __setMockFiles;
