/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const H = require('jest-haste-map').H;

const nodeModulesPaths = require('resolve/lib/node-modules-paths');
const path = require('path');
const resolve = require('resolve');

const paths =
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
    };

    this._moduleMap = moduleMap;
    this._moduleNameCache = Object.create(null);
    this._modulePathCache = Object.create(null);
  }

  static findNodeModule(path, basedir, extensions) {
    try {
      return resolve.sync(path, {basedir, paths, extensions});
    } catch (e) {}
    return null;
  }

  resolveModule(from, moduleName) {
    const dirname = path.dirname(from);
    const extensions = this._options.extensions;
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
    module = Resolver.findNodeModule(moduleName, dirname, extensions);
    if (module) {
      return this._moduleNameCache[key] = module;
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
    throw new Error(
      `Cannot find module '${moduleName}' from '${relativePath || '.'}'`
    );
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
      const module =
        map[this._options.defaultPlatform] || map[H.GENERIC_PLATFORM];
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
  }

  getModulePaths(from) {
    if (!this._modulePathCache[from]) {
      const paths = nodeModulesPaths(from, {});
      if (paths[paths.length - 1] === undefined) {
        // circumvent node-resolve bug that adds `undefined` as last item.
        paths.pop();
      }
      this._modulePathCache[from] = paths;
    }
    return this._modulePathCache[from];
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
  }

}

module.exports = Resolver;
