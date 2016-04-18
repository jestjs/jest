/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const createHasteMap = require('../lib/createHasteMap');

class HasteResolver {

  constructor(config, options) {
    this._map = createHasteMap(config, options);
    this._defaultPlatform = config.haste.defaultPlatform;

    // warm-up and cache mocks
    this._map.build();
  }

  matchFiles(pattern) {
    return this._map.matchFiles(pattern);
  }

  getAllModules() {
    return this._depGraph.getAllModules();
  }

  getModuleForPath(path) {
    return this._depGraph.getModuleForPath(path);
  }

  getShallowDependencies(entryPath) {
    return this._map.getShallowDependencies({
      entryPath,
      platform: this._defaultPlatform,
    });
  }

  getHasteMap() {
    return this._map.build();
  }

}

module.exports = HasteResolver;
