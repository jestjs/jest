/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const createHasteMap = require('../lib/createHasteMap');
const path = require('path');

/* eslint-disable max-len */
const REQUIRE_EXTENSIONS_PATTERN = /(\b(?:require\s*?\.\s*?(?:requireActual|requireMock)|jest\s*?\.\s*?genMockFromModule)\s*?\(\s*?)(['"])([^'"]+)(\2\s*?\))/g;
/* eslint-enable max-len */

class HasteResolver {

  constructor(config, options) {
    this._map = createHasteMap(config, options);
    this._defaultPlatform = config.haste.defaultPlatform;
    this._mocksPattern = new RegExp(config.mocksPattern);
    this._mappedModuleNames = Object.create(null);
    if (config.moduleNameMapper.length) {
      config.moduleNameMapper.forEach(
        map => this._mappedModuleNames[map[1]] = new RegExp(map[0])
      );
    }

    // warm-up and cache mocks
    this._hasteMapPromise = this._map.build().then(data =>
      this._getAllMocks().then(mocks => {
        data.mocks = mocks;
        return this._map.persist(data);
      })
    );

    /*extractRequires: code => {
      const data = HasteMap.extractRequires(code);
      data.code = data.code.replace(
        REQUIRE_EXTENSIONS_PATTERN,
        (match, pre, quot, dep, post) => {
          data.deps.sync.push(dep);
          return match;
        }
      );

      return this._updateModuleMappings(data);
    },*/
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
    return this._hasteMapPromise;
  }

  _getAllMocks() {
    const mocks = Object.create(null);
    return this._map
      .matchFiles(this._mocksPattern)
      .then(files => files.forEach(
        file => mocks[path.basename(file, path.extname(file))] = file
      ))
      .then(() => mocks);
  }

  _updateModuleMappings(data) {
    const nameMapper = this._mappedModuleNames;
    const updateMapping = (moduleName, index, array) => {
      for (const mappedModuleName in nameMapper) {
        const regex = nameMapper[mappedModuleName];
        if (regex.test(moduleName)) {
          array[index] = mappedModuleName;
          return;
        }
      }
    };
    data.deps.sync.forEach(updateMapping);
    return data;
  }

}

module.exports = HasteResolver;
