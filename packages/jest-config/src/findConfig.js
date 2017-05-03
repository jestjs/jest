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

import type {InitialOptions, Path} from 'types/Config';

const fs = require('fs');
const path = require('path');

const JEST_CONFIG = 'jest.config.js';
const PACAKAGE_JSON = 'package.json';

const findConfig = (root: Path): InitialOptions => {
  let directory = root;
  // $FlowFixMe
  let options: InitialOptions = {};
  do {
    const configJsFilePath = path.join(directory, JEST_CONFIG);
    if (fs.existsSync(configJsFilePath)) {
      // $FlowFixMe
      options = require(configJsFilePath);
      break;
    }
    const packageJsonFilePath = path.join(directory, PACAKAGE_JSON);
    if (fs.existsSync(packageJsonFilePath)) {
      // $FlowFixMe
      const pkg = require(packageJsonFilePath);
      if (pkg.jest) {
        options = pkg.jest;
      }
      // Even if there is no configuration, we stop traveling up the
      // tree if we hit a `package.json` file.
      break;
    }
  } while (directory !== (directory = path.dirname(directory)));
  options.rootDir = options.rootDir
    ? path.resolve(root, options.rootDir)
    : root;
  return options;
};

module.exports = findConfig;
