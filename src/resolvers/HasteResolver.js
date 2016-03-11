/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const DependencyGraph = require('node-haste');

const Cache = DependencyGraph.Cache;
const FileWatcher = DependencyGraph.FileWatcher;

const getCacheKey = require('../lib/getCacheKey');
const path = require('path');

const REQUIRE_EXTENSIONS_PATTERN = /(\b(?:require\s*?\.\s*?(?:requireActual|requireMock)|jest\s*?\.\s*?genMockFromModule)\s*?\(\s*?)(['"])([^'"]+)(\2\s*?\))/g;

const createWatcher = config => {
  if (config.watchman && FileWatcher.canUseWatchman()) {
    return new FileWatcher(config.testPathDirs.map(dir => ({dir})));
  }

  return FileWatcher.createDummyWatcher();
};

class HasteResolver {

  constructor(config, options) {
    const extensions = config.moduleFileExtensions
      .concat(config.testFileExtensions);
    const ignoreFilePattern = new RegExp(
      [config.cacheDirectory].concat(config.modulePathIgnorePatterns).join('|')
    );

    this._defaultPlatform = config.haste.defaultPlatform;
    this._hasteMapPromise = null;
    this._mocksPattern = new RegExp(config.mocksPattern);

    this._cache = new Cache({
      resetCache: options.resetCache,
      cacheDirectory: config.cacheDirectory,
      cacheKey: getCacheKey('jest-haste-map', config),
    });

    this._fileWatcher = createWatcher(config);

    this._mappedModuleNames = Object.create(null);
    if (config.moduleNameMapper.length) {
      config.moduleNameMapper.forEach(
        map => this._mappedModuleNames[map[1]] = new RegExp(map[0])
      );
    }

    this._depGraph = new DependencyGraph(Object.assign({}, config.haste, {
      roots: config.testPathDirs,
      ignoreFilePath: path => ignoreFilePattern.test(path),
      enableAssetMap: false,
      cache: this._cache,
      fileWatcher: this._fileWatcher,
      extensions,
      mocksPattern: new RegExp(config.mocksPattern),
      extractRequires: code => {
        const data = DependencyGraph.extractRequires(code);
        data.code = data.code.replace(
          REQUIRE_EXTENSIONS_PATTERN,
          (match, pre, quot, dep, post) => {
            data.deps.sync.push(dep);
            return match;
          }
        );

        return this._updateModuleMappings(data);
      },
      shouldThrowOnUnresolvedErrors: () => false,
    }));

    // warm-up
    this._depGraph.load();
  }

  matchFilesByPattern(pattern) {
    return this._depGraph.matchFilesByPattern(pattern);
  }

  getAllModules() {
    return this._depGraph.getAllModules();
  }

  getModuleForPath(path) {
    return this._depGraph.getModuleForPath(path);
  }

  getHasteMap() {
    if (this._hasteMapPromise) {
      return this._hasteMapPromise;
    }

    return this._hasteMapPromise = this._depGraph.load().then(map => ({
      modules: this._getAllModules(map),
      mocks: this._getAllMocks(),
    }));
  }

  getShallowDependencies(entryPath) {
    return this._depGraph.getDependencies({
      entryPath,
      platform: this._defaultPlatform,
      recursive: false,
    });
  }

  getFS() {
    return this._depGraph.getFS();
  }

  end() {
    // Make sure the graph is loaded before we end it.
    return this._depGraph.load()
      .then(() => Promise.all([this._fileWatcher.end(), this._cache.end()]));
  }

  _getAllModules(map) {
    const modules = Object.create(null);
    for (const name in map) {
      const module = map[name][this._defaultPlatform] || map[name].generic;
      if (module) {
        modules[name] = module.path;
      }
    }
    return modules;
  }

  _getAllMocks() {
    const mocks = Object.create(null);
    this._depGraph.getFS()
      .matchFilesByPattern(new RegExp(this._mocksPattern))
      .forEach(file => mocks[path.basename(file, path.extname(file))] = file);
    return mocks;
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
