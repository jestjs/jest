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

function loadFromPackage(filePath, argv) {
  const root = path.dirname(filePath);
  return utils.readFile(filePath).then(fileData => {
    const packageJsonData = JSON.parse(fileData);
    const config = packageJsonData.jest;
    if (config) {
      config.name = packageJsonData.name;
      if (!config.hasOwnProperty('rootDir')) {
        config.rootDir = root;
      } else {
        config.rootDir = path.resolve(root, config.rootDir);
      }
      return normalize(config, argv);
    }

    // Default config
    return normalize({
      name: root.replace(/[/\\]/g, '_'),
      rootDir: root,
    }, argv);
  });
}

module.exports = loadFromPackage;
