/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const normalize = require('./normalize');
const utils = require('jest-util');

function loadFromFile(filePath, argv) {
  return utils.readFile(filePath).then(fileData => {
    const config = JSON.parse(fileData);
    if (!config.hasOwnProperty('rootDir')) {
      config.rootDir = process.cwd();
    } else {
      config.rootDir = path.resolve(path.dirname(filePath), config.rootDir);
    }
    return normalize(config, argv);
  });
}

module.exports = loadFromFile;
