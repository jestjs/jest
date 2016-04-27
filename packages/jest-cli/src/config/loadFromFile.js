/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const fs = require('fs');
const normalize = require('./normalize');
const path = require('path');
const promisify = require('../lib/promisify');

function loadFromFile(filePath, argv) {
  return promisify(fs.readFile)(filePath).then(data => {
    const parse = () => {
      try {
        return JSON.parse(data);
      } catch (e) {
        throw new Error(`Jest: Failed to parse config file ${filePath}.`);
      }
    };

    const config = parse();
    config.rootDir = config.rootDir
      ? path.resolve(path.dirname(filePath), config.rootDir)
      : process.cwd();
    return normalize(config, argv);
  });
}

module.exports = loadFromFile;
