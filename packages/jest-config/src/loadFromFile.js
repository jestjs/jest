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

import type {Path} from 'types/Config';

const fs = require('fs');
const normalize = require('./normalize');
const jsonlint = require('./vendor/jsonlint');
const path = require('path');
const promisify = require('./lib/promisify');

function loadFromFile(filePath: Path, argv: Object) {
  return new Promise(resolve => {
    // $FlowFixMe
    const config = require(filePath);
    config.rootDir = config.rootDir
      ? path.resolve(path.dirname(filePath), config.rootDir)
      : process.cwd();
    resolve(normalize(config, argv));
  });
}

module.exports = loadFromFile;
