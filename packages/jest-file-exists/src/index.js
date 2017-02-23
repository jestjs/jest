/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Path} from 'types/Config';
import type {HasteFS} from 'types/HasteMap';

const fs = require('fs');

module.exports = (filePath: Path, hasteFS: ?HasteFS): boolean =>
  hasteFS && hasteFS.exists(filePath) || fs.existsSync(filePath);
