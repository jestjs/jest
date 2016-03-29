/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const os = require('os');

const pkg = require('../package.json');

exports.VERSION = pkg.version;
exports.MAX_WORKERS = os.cpus().length;
exports.NODE_MODULES = path.sep + 'node_modules' + path.sep;
