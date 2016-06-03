/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const createHasteMap = require('./createHasteMap');
const createResolver = require('./createResolver');
const utils = require('jest-util');

module.exports = (config, options) => {
  utils.createDirectory(config.cacheDirectory);
  return createHasteMap(config, {
    resetCache: !config.cache,
    maxWorkers: options.maxWorkers,
  }).build().then(moduleMap => ({
    moduleMap,
    resolver: createResolver(config, moduleMap),
  }));
};
