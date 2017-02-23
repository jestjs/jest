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
const path = require('path');
const promisify = require('./lib/promisify');

function loadFromPackage(filePath: Path, argv: Object) {
  return promisify(fs.access)(filePath, fs.R_OK).then(
    () => {
      // $FlowFixMe
      const packageData = require(filePath);
      const config = packageData.jest || {};
      const root = path.dirname(filePath);
      config.rootDir = config.rootDir
        ? path.resolve(root, config.rootDir)
        : root;
      return normalize(config, argv);
    },
    () => null,
  );
}

module.exports = loadFromPackage;
