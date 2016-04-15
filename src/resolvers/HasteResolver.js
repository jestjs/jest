/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const HasteMap = require('jest-haste-map');

const path = require('path');

/* eslint-disable max-len */
const REQUIRE_EXTENSIONS_PATTERN = /(\b(?:require\s*?\.\s*?(?:requireActual|requireMock)|jest\s*?\.\s*?genMockFromModule)\s*?\(\s*?)(['"])([^'"]+)(\2\s*?\))/g;
/* eslint-enable max-len */

class HasteResolver {

  constructor(config, options) {
    const extensions = Array.from(new Set(
      config.moduleFileExtensions.concat(config.testFileExtensions)
    ));
    const ignorePattern = new RegExp(
      [config.cacheDirectory].concat(config.modulePathIgnorePatterns).join('|')
    );

    this._defaultPlatform = config.haste.defaultPlatform;
    this._mocksPattern = new RegExp(config.mocksPattern);

    this._mappedModuleNames = Object.create(null);
    if (config.moduleNameMapper.length) {
      config.moduleNameMapper.forEach(
        map => this._mappedModuleNames[map[1]] = new RegExp(map[0])
      );
    }

    this._map = new HasteMap({
      cacheDirectory: options.cacheDirectory,
      extensions,
      ignorePattern,
      nodeModulesWhitelist: config.haste.nodeModulesWhitelist,
      platforms: config.haste.platforms || ['ios', 'android'],
      resetCache: options.resetCache,
      roots: config.testPathDirs,
      useWatchman: config.watchman,
    });

    // warm-up
    this._map.build();

    /*extractRequires: code => {
      const data = DependencyGraph.extractRequires(code);
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

  getHasteMap() {
    if (this._mapPromise) {
      return this._mapPromise;
    }

    return this._mapPromise = Promise.all([
      this._map.build(),
      this._getAllMocks(),
    ]).then(data => this._getModuleMap(data[0].map, data[1]));
  }

  getShallowDependencies(entryPath) {
    return this._depGraph.getDependencies({
      entryPath,
      platform: this._defaultPlatform,
      recursive: false,
    });
  }

  _getModuleMap(map, mocks) {
    const modules = Object.create(null);
    const packages = Object.create(null);
    for (const name in map) {
      const module =
        map[name][this._defaultPlatform] ||
        map[name][HasteMap.GENERIC_PLATFORM];
      if (module) {
        if (module.type == 'package') {
          packages[name] = module.path;
        } else {
          modules[name] = module.path;
        }
      }
    }
    return {modules, mocks, packages};
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
