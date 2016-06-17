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

import type {
  HasteMap,
  HType,
  HTypeValue,
} from 'types/HasteMap';
import type {Config, Path} from 'types/Config';

const H: HType = require('jest-haste-map').H;

const fs = require('fs');
const nodeModulesPaths = require('resolve/lib/node-modules-paths');
const path = require('path');
const resolve = require('resolve');

type ResolverConfig = {
  defaultPlatform: ?string,
  extensions: Array<string>,
  hasCoreModules: boolean,
  moduleDirectories: Array<string>,
  moduleNameMapper: ?{[key: string]: RegExp},
  modulePaths: Array<Path>,
  platforms?: Array<string>,
};

type FindNodeModuleConfig = {
  basedir: Path,
  extensions: Array<string>,
  paths?: Array<Path>,
  moduleDirectory: Array<string>,
};

export type ResolveModuleConfig = {skipNodeResolution?: boolean};

const NATIVE_PLATFORM = 'native';

const nodePaths =
  (process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : null);

function compact(array: Array<?Path>): Array<Path> {
  const result = [];
  for (let i = 0; i < array.length; ++i) {
    const element = array[i];
    if (element != null) {
      result.push(element);
    }
  }
  return result;
}

const getModuleNameMapper = (config: Config) => {
  if (config.moduleNameMapper.length) {
    const moduleNameMapper = Object.create(null);
    config.moduleNameMapper.forEach(
      map => moduleNameMapper[map[1]] = new RegExp(map[0])
    );
    return moduleNameMapper;
  }
  return null;
};

class Resolver {
  _options: ResolverConfig;
  _supportsNativePlatform: boolean;
  _moduleMap: HasteMap;
  _moduleNameCache: {[name: string]: Path};
  _modulePathCache: {[path: Path]: Array<Path>};

  constructor(moduleMap: HasteMap, options: ResolverConfig) {
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

  static create(
    config: Config,
    moduleMap: HasteMap,
  ): Resolver {
    return new Resolver(moduleMap, {
      defaultPlatform: config.haste.defaultPlatform,
      extensions: config.moduleFileExtensions.map(extension => '.' + extension),
      hasCoreModules: true,
      moduleDirectories: config.moduleDirectories,
      moduleNameMapper: getModuleNameMapper(config),
      modulePaths: config.modulePaths,
      platforms: config.haste.platforms,
    });
  }

  static findNodeModule(path: Path, options: FindNodeModuleConfig): ?Path {
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

  static fileExists(filePath: Path): boolean {
    try {
      return fs.statSync(filePath).isFile();
    } catch (e) {}
    return false;
  }

  resolveModule(
    from: Path,
    moduleName: string,
    options?: ResolveModuleConfig
  ): Path {
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
    (err: any).code = 'MODULE_NOT_FOUND';
    throw err;
  }

  isCoreModule(moduleName: string): boolean {
    return this._options.hasCoreModules && resolve.isCore(moduleName);
  }

  getModule(name: string, type?: HTypeValue): ?Path {
    if (!type) {
      type = H.MODULE;
    }
    const map = this._moduleMap.map[name];
    if (map) {
      const platform = this._options.defaultPlatform;
      let module = platform && map[platform];
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

  getPackage(name: string): ?Path {
    return this.getModule(name, H.PACKAGE);
  }

  getMockModule(name: string): ?Path {
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

  getModulePaths(from: Path): Array<Path> {
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

  resolveDependencies(
    file: Path,
    options?: ResolveModuleConfig
  ): Array<Path> {
    if (!this._moduleMap.files[file]) {
      return [];
    }

    return compact(this._moduleMap.files[file][H.DEPENDENCIES]
      .map(dependency => {
        if (this.isCoreModule(dependency)) {
          return null;
        }
        try {
          return this.resolveModule(file, dependency, options);
        } catch (e) {}
        return this.getMockModule(dependency) || null;
      }));
  }

  resolveInverseDependencies(
    paths: Set<Path>,
    filter: (file: Path) => boolean,
    options?: ResolveModuleConfig
  ): Array<Path> {
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
      return [];
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

  _resolveStubModuleName(moduleName: string): ?Path {
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
