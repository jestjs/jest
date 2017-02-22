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

import type {Path} from 'types/Config';
import type {ModuleMap} from 'jest-haste-map';

const nodeModulesPaths = require('resolve/lib/node-modules-paths');
const path = require('path');
const isBuiltinModule = require('is-builtin-module');

type ResolverConfig = {|
  browser?: boolean,
  defaultPlatform: ?string,
  extensions: Array<string>,
  hasCoreModules: boolean,
  moduleDirectories: Array<string>,
  moduleNameMapper: ?Array<ModuleNameMapperConfig>,
  modulePaths: Array<Path>,
  platforms?: Array<string>,
  resolver: ?Path,
|};

type FindNodeModuleConfig = {|
  basedir: Path,
  browser?: boolean,
  extensions?: Array<string>,
  moduleDirectory?: Array<string>,
  paths?: Array<Path>,
  resolver?: ?Path,
|};

type ModuleNameMapperConfig = {|
  regex: RegExp,
  moduleName: string,
|};

type BooleanObject = {[key: string]: boolean};

export type ResolveModuleConfig = {|
  skipNodeResolution?: boolean,
|};

const NATIVE_PLATFORM = 'native';

const nodePaths =
  (process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : null);

class Resolver {
  _options: ResolverConfig;
  _moduleMap: ModuleMap;
  _moduleIDCache: {[key: string]: string};
  _moduleNameCache: {[name: string]: Path};
  _modulePathCache: {[path: Path]: Array<Path>};

  constructor(moduleMap: ModuleMap, options: ResolverConfig) {
    this._options = {
      browser: options.browser,
      defaultPlatform: options.defaultPlatform,
      extensions: options.extensions,
      hasCoreModules: options.hasCoreModules === undefined
        ? true
        : options.hasCoreModules,
      moduleDirectories: options.moduleDirectories || ['node_modules'],
      moduleNameMapper: options.moduleNameMapper,
      modulePaths: options.modulePaths,
      platforms: options.platforms,
      resolver: options.resolver,
    };
    this._moduleMap = moduleMap;
    this._moduleIDCache = Object.create(null);
    this._moduleNameCache = Object.create(null);
    this._modulePathCache = Object.create(null);
  }

  static findNodeModule(path: Path, options: FindNodeModuleConfig): ?Path {
    /* $FlowFixMe */
    const resolver = require(options.resolver || './defaultResolver.js');
    const paths = options.paths;

    try {
      return resolver(path,
        {
          basedir: options.basedir,
          browser: options.browser,
          extensions: options.extensions,
          moduleDirectory: options.moduleDirectory,
          paths: paths ? (nodePaths || []).concat(paths) : nodePaths,
        },
      );
    } catch (e) {}
    return null;
  }

  resolveModule(
    from: Path,
    moduleName: string,
    options?: ResolveModuleConfig,
  ): Path {
    const dirname = path.dirname(from);
    const paths = this._options.modulePaths;
    const moduleDirectory = this._options.moduleDirectories;
    const key = dirname + path.delimiter + moduleName;
    const defaultPlatform = this._options.defaultPlatform;
    const extensions = this._options.extensions.slice();
    if (this._supportsNativePlatform()) {
      extensions.unshift('.' + NATIVE_PLATFORM + '.js');
    }
    if (defaultPlatform) {
      extensions.unshift('.' + defaultPlatform + '.js');
    }

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
    // If skipNodeResolution is given we ignore all modules that look like
    // node modules (ie. are not relative requires). This enables us to speed
    // up resolution when we build a dependency graph because we don't have
    // to look at modules that may not exist and aren't mocked.
    const skipResolution =
      options &&
      options.skipNodeResolution &&
      !moduleName.includes(path.sep);

    if (!skipResolution) {
      module = Resolver.findNodeModule(moduleName, {
        basedir: dirname,
        browser: this._options.browser,
        extensions,
        moduleDirectory,
        paths,
        resolver: this._options.resolver,
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
          path.join.apply(path, [path.dirname(module)].concat(parts)),
        );
      } catch (ignoredError) {}
    }

    // 4. Throw an error if the module could not be found. `resolve.sync`
    //    only produces an error based on the dirname but we have the actual
    //    current module name available.
    const relativePath = path.relative(dirname, from);
    const err = new Error(
      `Cannot find module '${moduleName}' from '${relativePath || '.'}'`,
    );
    (err: any).code = 'MODULE_NOT_FOUND';
    throw err;
  }

  isCoreModule(moduleName: string): boolean {
    return (
      this._options.hasCoreModules &&
      isBuiltinModule(moduleName)
    );
  }

  getModule(name: string): ?Path {
    return this._moduleMap.getModule(
      name,
      this._options.defaultPlatform,
      this._supportsNativePlatform(),
    );
  }

  getModulePath(from: Path, moduleName: string) {
    if (moduleName[0] !== '.' || path.isAbsolute(moduleName)) {
      return moduleName;
    }
    return path.normalize(path.dirname(from) + '/' + moduleName);
  }

  getPackage(name: string): ?Path {
    return this._moduleMap.getPackage(
      name,
      this._options.defaultPlatform,
      this._supportsNativePlatform(),
    );
  }

  getMockModule(from: Path, name: string): ?Path {
    const mock = this._moduleMap.getMockModule(name);
    if (mock) {
      return mock;
    } else {
      const moduleName = this._resolveStubModuleName(from, name);
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

  getModuleID(
    virtualMocks: BooleanObject,
    from: Path,
    _moduleName?: ?string,
  ): string {
    const moduleName = _moduleName || '';

    const key = from + path.delimiter + moduleName;
    if (this._moduleIDCache[key]) {
      return this._moduleIDCache[key];
    }

    const moduleType = this._getModuleType(moduleName);
    const absolutePath = this._getAbsolutPath(virtualMocks, from, moduleName);
    const mockPath = this._getMockPath(from, moduleName);

    const sep = path.delimiter;
    const id = (moduleType + sep + (absolutePath ? (absolutePath + sep) : '') +
      (mockPath ? (mockPath + sep) : ''));

    return this._moduleIDCache[key] = id;
  }

  _getModuleType(moduleName: string): 'node' | 'user' {
    return this.isCoreModule(moduleName) ? 'node' : 'user';
  }

  _getAbsolutPath(
    virtualMocks: BooleanObject,
    from: Path,
    moduleName: string,
  ): ?string {
    if (this.isCoreModule(moduleName)) {
      return moduleName;
    }
    return this._isModuleResolved(from, moduleName)
      ? this.getModule(moduleName)
      : this._getVirtualMockPath(virtualMocks, from, moduleName);
  }

  _getMockPath(from: Path, moduleName: string): ?string {
    return !this.isCoreModule(moduleName)
      ? this.getMockModule(from, moduleName)
      : null;
  }

  _getVirtualMockPath(
    virtualMocks: BooleanObject,
    from: Path,
    moduleName: string,
  ): Path {
    const virtualMockPath = this.getModulePath(from, moduleName);
    return virtualMocks[virtualMockPath]
      ? virtualMockPath
      : moduleName ? this.resolveModule(from, moduleName) : from;
  }

  _isModuleResolved(from: Path, moduleName: string): boolean {
    return !!(
      this.getModule(moduleName) ||
      this.getMockModule(from, moduleName)
    );
  }

  _resolveStubModuleName(from: Path, moduleName: string): ?Path {
    const dirname = path.dirname(from);
    const paths = this._options.modulePaths;
    const extensions = this._options.extensions;
    const moduleDirectory = this._options.moduleDirectories;

    const moduleNameMapper = this._options.moduleNameMapper;
    if (moduleNameMapper) {
      for (const {moduleName: mappedModuleName, regex} of moduleNameMapper) {
        if (regex.test(moduleName)) {
          const matches = moduleName.match(regex);
          if (!matches) {
            moduleName = mappedModuleName;
          } else {
            moduleName = mappedModuleName.replace(
              /\$([0-9]+)/g,
              (_, index) => matches[parseInt(index, 10)],
            );
          }
          return this.getModule(moduleName) || Resolver.findNodeModule(
            moduleName,
            {
              basedir: dirname,
              browser: this._options.browser,
              extensions,
              moduleDirectory,
              paths,
            },
          );
        }
      }
    }
    return null;
  }

  _supportsNativePlatform() {
    return (this._options.platforms || []).indexOf(NATIVE_PLATFORM) !== -1;
  }
}

module.exports = Resolver;
