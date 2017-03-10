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

const path = require('path');
const readPkg = require('read-pkg');

function loadFromPackage(root: Path, argv: Object) {
  return readPkg(root).then(
    packageData => {
      const config = packageData.jest || {};
      config.rootDir = config.rootDir
        ? path.resolve(root, config.rootDir)
        : root;
      return config;
    },
    () => null,
  );
}

module.exports = loadFromPackage;
