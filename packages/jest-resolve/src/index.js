/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const H = require('jest-haste-map').H;

const fs = require('fs');
const nodeModulesPaths = require('resolve/lib/node-modules-paths');
const path = require('path');
const resolve = require('resolve');

const NATIVE_PLATFORM = 'native';

const nodePaths =
  (process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : null);

class Resolver {

  constructor(moduleMap, options) {
    this._options = {
      defaultPlatform: options.defaultPlatform,
      extensions: options.extensions,
      hasCoreModules:
        options.hasCoreModules === undefined ? true : options.hasCoreModules,
      moduleDirectories: options.moduleDirectories || ['node_modules'],
      moduleNameMapper: options.moduleNameMapper,
      modulePaths: options.modulePaths,
    };

    this._supportsNativePlatform =
      (options.platforms || []).indexOf(NATIVE_PLATFORM) !== -1;
    this._moduleMap = moduleMap;
    this._moduleNameCache = Object.create(null);
    this._modulePathCache = Object.create(null);
  }

  static findNodeModule(path, options) {
    const paths = options.paths;
    try {
      return resolve.sync(
        path,
        {
          basedir: options.basedir,
          extensions: options.extensions,
          moduleDirectory: options.moduleDirectory,
          paths: paths ? (nodePaths || []).concat(paths) : nodePaths,
        }
      );
    } catch (e) {}
    return null;
  }

  static fileExists(filePath) {
    try {
      fs.accessSync(filePath, fs.R_OK);
      return true;
    } catch (e) {}
    return false;
  }

  resolveModule(from, moduleName, options) {
    const dirname = path.dirname(from);
    const paths = this._options.modulePaths;
    const extensions = this._options.extensions;
    const moduleDirectory = this._options.moduleDirectories;
    const key = dirname + path.delimiter + moduleName;

    // 0. If we have already resolved this module for this directory name,
    //    return a value from the cache.
    if (this._moduleNameCache[key]) {
      return this._moduleNameCache[key];
    }

    // 1. Check if the module is a haste module.
    let module = this.getModule(moduleName);
    if (module) {
      return this._moduleNameCache[key] = module;
    }

    // 2. Check if the module is a node module and resolve it based on
    //    the node module resolution algorithm.
    if (!options || !options.skipNodeResolution) {
      module = Resolver.findNodeModule(moduleName, {
        basedir: dirname,
        extensions,
        moduleDirectory,
        paths,
      });

      if (module) {
        return this._moduleNameCache[key] = module;
      }
    }

    // 3. Resolve "haste packages" which are `package.json` files outside of
    // `node_modules` folders anywhere in the file system.
    const parts = moduleName.split('/');
    module = this.getPackage(parts.shift());
    if (module) {
      try {
        return this._moduleNameCache[key] = require.resolve(
          path.join.apply(path, [path.dirname(module)].concat(parts))
        );
      } catch (ignoredError) {}
    }

    // 4. Throw an error if the module could not be found. `resolve.sync`
    //    only produces an error based on the dirname but we have the actual
    //    current module name available.
    const relativePath = path.relative(dirname, from);
    const err = new Error(
      `Cannot find module '${moduleName}' from '${relativePath || '.'}'`
    );
    err.code = 'MODULE_NOT_FOUND';
    throw err;
  }

  isCoreModule(moduleName) {
    return this._options.hasCoreModules && resolve.isCore(moduleName);
  }

  getModule(name, type) {
    if (!type) {
      type = H.MODULE;
    }
    const map = this._moduleMap.map[name];
    if (map) {
      let module = map[this._options.defaultPlatform];
      if (!module && map[NATIVE_PLATFORM] && this._supportsNativePlatform) {
        module = map[NATIVE_PLATFORM];
      } else if (!module) {
        module = map[H.GENERIC_PLATFORM];
      }
      if (module && module[H.TYPE] === type) {
        return module[H.PATH];
      }
    }
    return null;
  }

  getPackage(name) {
    return this.getModule(name, H.PACKAGE);
  }

  getMockModule(name) {
    if (this._moduleMap.mocks[name]) {
      return this._moduleMap.mocks[name];
    } else {
      const moduleName = this._resolveStubModuleName(name);
      if (moduleName) {
        return this.getModule(moduleName) || moduleName;
      }
    }
    return null;
  }

  getModulePaths(from) {
    if (!this._modulePathCache[from]) {
      const moduleDirectory = this._options.moduleDirectories;
      const paths = nodeModulesPaths(from, {moduleDirectory});
      if (paths[paths.length - 1] === undefined) {
        // circumvent node-resolve bug that adds `undefined` as last item.
        paths.pop();
      }
      this._modulePathCache[from] = paths;
    }
    return this._modulePathCache[from];
  }

  resolveDependencies(file, options) {
    if (!this._moduleMap.files[file]) {
      return [];
    }

    return this._moduleMap.files[file][H.DEPENDENCIES]
      .map(dependency => {
        if (this.isCoreModule(dependency)) {
          return null;
        }
        try {
          return this.resolveModule(file, dependency, options);
        } catch (e) {}
        return this.getMockModule(dependency) || null;
      })
      .filter(dependency => !!dependency);
  }

  resolveInverseDependencies(paths, filter, options) {
    const collectModules = (relatedPaths, moduleMap, changed) => {
      const visitedModules = new Set();
      while (changed.size) {
        changed = new Set(moduleMap.filter(module => (
          !visitedModules.has(module.file) &&
          module.dependencies.some(dep => dep && changed.has(dep))
        )).map(module => {
          const file = module.file;
          if (filter(file)) {
            relatedPaths.add(file);
          }
          visitedModules.add(file);
          return module.file;
        }));
      }
      return relatedPaths;
    };

    if (!paths.size) {
      return Promise.resolve([]);
    }

    const relatedPaths = new Set();
    const changed = new Set();
    for (const path of paths) {
      if (Resolver.fileExists(path)) {
        const module = this._moduleMap.files[path];
        if (module) {
          changed.add(path);
          if (filter(path)) {
            relatedPaths.add(path);
          }
        }
      }
    }

    const modules = [];
    for (const file in this._moduleMap.files) {
      modules.push({
        file,
        dependencies: this.resolveDependencies(file, options),
      });
    }
    return Array.from(collectModules(relatedPaths, modules, changed));
  }

  _resolveStubModuleName(moduleName) {
    const moduleNameMapper = this._options.moduleNameMapper;
    if (moduleNameMapper) {
      for (const mappedModuleName in moduleNameMapper) {
        const regex = moduleNameMapper[mappedModuleName];
        if (regex.test(moduleName)) {
          return moduleName.replace(regex, mappedModuleName);
        }
      }
    }
    return null;
  }

}

module.exports = Resolver;
