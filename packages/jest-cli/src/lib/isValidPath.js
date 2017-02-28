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

import type {Config} from 'types/Config';

const path = require('path');

const SNAPSHOT_EXTENSION = 'snap';

function isValidPath(config: Config, filePath: string) {
  const coverageDirectory = config.coverageDirectory ||
    path.resolve(config.rootDir, 'coverage');
    
  return !filePath.includes(coverageDirectory) &&
    !filePath.endsWith(`.${SNAPSHOT_EXTENSION}`);
}

module.exports = isValidPath;
