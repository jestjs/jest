/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* eslint-disable fb-www/object-create-only-one-param */

'use strict';

const Cache = require('node-haste/lib/Cache');
const DependencyGraph = require('node-haste');
const FileWatcher = require('node-haste/lib/FileWatcher');

const extractRequires = require('node-haste/lib/lib/extractRequires');

const version = require('../../package').version;
const REQUIRE_EXTENSIONS_PATTERN = /(\b(?:require\s*?\.\s*?(?:requireActual|requireMock)|jest\s*?\.\s*?genMockFromModule)\s*?\(\s*?)(['"])([^'"]+)(\2\s*?\))/g;

const cacheFlag = Promise.resolve(1);

class HasteResolver {

  constructor(config, options) {
    const extensions = config.moduleFileExtensions
      .concat(config.testFileExtensions);
    const ignoreFilePattern = new RegExp(
      [config.cacheDirectory].concat(config.modulePathIgnorePatterns).join('|')
    );

    this._defaultPlatform = config.haste.defaultPlatform;
    this._resolvePromises = Object.create(null);

    this._cache = new Cache({
      resetCache: options.resetCache,
      cacheDirectory: config.cacheDirectory,
      cacheKey: [
        'jest',
        version,
        config.name,
        config.testPathDirs.join(';'),
        ignoreFilePattern.toString(),
      ].concat(extensions).join('$'),
    });

    this._fileWatcher = new FileWatcher(
      config.testPathDirs.map(dir => ({dir}))
    );

    this._mappedModuleNames = Object.create(null);
    if (config.moduleNameMapper.length) {
      config.moduleNameMapper.forEach(
        map => this._mappedModuleNames[map[1]] = new RegExp(map[0])
      );
    }

    this._depGraph = new DependencyGraph(Object.assign({}, config.haste, {
      roots: config.testPathDirs,
      ignoreFilePath: path => path.match(ignoreFilePattern),
      cache: this._cache,
      fileWatcher: this._fileWatcher,
      extensions,
      mocksPattern: new RegExp(config.mocksPattern),
      extractRequires: code => {
        const data = extractRequires(code);
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

  getDependencies(path) {
    if (this._resolvePromises[path]) {
      return this._resolvePromises[path];
    }
    let isCached = true;
    return this._resolvePromises[path] = this._depGraph.load()
      .then(() => this._cache.get(
        path,
        'jestModuleMap',
        () => {
          isCached = false;
          return this._resolveDependencies(path);
        }
      ).then(
        moduleMap => {
          if (
            !isCached || (
              this._validateCache(moduleMap.mocks) &&
              this._validateCache(moduleMap.resources)
            )
          ) {
            return moduleMap;
          }

          // If the cache was not generated *right now* or one of the
          // recursive dependencies has changed, invalidate the cache
          // and re-resolve the path.
          this._cache.invalidate(path, 'jestModuleMap');
          delete this._resolvePromises[path];
          return this.getDependencies(path);
        }
      )
    );
  }

  getShallowDependencies(path) {
    return this._depGraph.getDependencies(path, this._defaultPlatform, false);
  }

  getFS() {
    return this._depGraph.getFS();
  }

  end() {
    // Make sure the graph is loaded before we end it.
    return this._depGraph.load()
      .then(() => Promise.all([this._fileWatcher.end(), this._cache.end()]));
  }

  _resolveDependencies(path) {
    return this._depGraph.getDependencies(path, this._defaultPlatform)
      .then(response =>
        response.finalize().then(() => {
          const deps = {
            mocks: response.mocks,
            resolvedModules: Object.create(null),
            resources: Object.create(null),
          };
          for (const resource in response.mocks) {
            const resourcePath = response.mocks[resource];
            this._cache.set(resourcePath, 'jestCacheFlag', cacheFlag);
          }
          return Promise.all(
            response.dependencies.map(module => {
              if (!deps.resolvedModules[module.path]) {
                deps.resolvedModules[module.path] = Object.create(null);
              }
              response.getResolvedDependencyPairs(module).forEach((pair) =>
                deps.resolvedModules[module.path][pair[0]] = pair[1].path
              );
              this._cache.set(module.path, 'jestCacheFlag', cacheFlag);
              return module.getName().then(
                name => deps.resources[name] = module.path
              );
            })
          ).then(() => deps);
        })
      );
  }

  _validateCache(resources) {
    for (const resource in resources) {
      const path = resources[resource];
      if (!this._cache.has(path, 'jestCacheFlag')) {
        return false;
      }
    }
    return true;
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
    data.deps.async.forEach(updateMapping);
    return data;
  }

}

module.exports = HasteResolver;
