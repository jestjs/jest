/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import {Config} from '@jest/types';
import {ModuleMap} from 'jest-haste-map'; // eslint-disable-line import/no-extraneous-dependencies
import {sync as realpath} from 'realpath-native';
import chalk from 'chalk';
import nodeModulesPaths from './nodeModulesPaths';
import isBuiltinModule from './isBuiltinModule';
import defaultResolver, {clearDefaultResolverCache} from './defaultResolver';
import {ResolverConfig} from './types';

type FindNodeModuleConfig = {
  basedir: Config.Path;
  browser?: boolean;
  extensions?: Array<string>;
  moduleDirectory?: Array<string>;
  paths?: Array<Config.Path>;
  resolver?: Config.Path | null;
  rootDir?: Config.Path;
};

type BooleanObject = Record<string, boolean>;

namespace Resolver {
  export type ResolveModuleConfig = {
    skipNodeResolution?: boolean;
    paths?: Array<Config.Path>;
  };
}

const NATIVE_PLATFORM = 'native';

// We might be inside a symlink.
const cwd = process.cwd();
const resolvedCwd = realpath(cwd) || cwd;
const {NODE_PATH} = process.env;
const nodePaths = NODE_PATH
  ? NODE_PATH.split(path.delimiter)
      .filter(Boolean)
      // The resolver expects absolute paths.
      .map(p => path.resolve(resolvedCwd, p))
  : undefined;

/* eslint-disable-next-line no-redeclare */
class Resolver {
  private readonly _options: ResolverConfig;
  private readonly _moduleMap: ModuleMap;
  private readonly _moduleIDCache: Map<string, string>;
  private readonly _moduleNameCache: Map<string, Config.Path>;
  private readonly _modulePathCache: Map<string, Array<Config.Path>>;
  private readonly _supportsNativePlatform: boolean;

  constructor(moduleMap: ModuleMap, options: ResolverConfig) {
    this._options = {
      browser: options.browser,
      defaultPlatform: options.defaultPlatform,
      extensions: options.extensions,
      hasCoreModules:
        options.hasCoreModules === undefined ? true : options.hasCoreModules,
      moduleDirectories: options.moduleDirectories || ['node_modules'],
      moduleNameMapper: options.moduleNameMapper,
      modulePaths: options.modulePaths,
      platforms: options.platforms,
      resolver: options.resolver,
      rootDir: options.rootDir,
    };
    this._supportsNativePlatform = options.platforms
      ? options.platforms.includes(NATIVE_PLATFORM)
      : false;
    this._moduleMap = moduleMap;
    this._moduleIDCache = new Map();
    this._moduleNameCache = new Map();
    this._modulePathCache = new Map();
  }

  static clearDefaultResolverCache() {
    clearDefaultResolverCache();
  }

  static findNodeModule(
    path: Config.Path,
    options: FindNodeModuleConfig,
  ): Config.Path | null {
    const resolver: typeof defaultResolver = options.resolver
      ? require(options.resolver)
      : defaultResolver;
    const paths = options.paths;

    try {
      return resolver(path, {
        basedir: options.basedir,
        browser: options.browser,
        defaultResolver,
        extensions: options.extensions,
        moduleDirectory: options.moduleDirectory,
        paths: paths ? (nodePaths || []).concat(paths) : nodePaths,
        rootDir: options.rootDir,
      });
    } catch (e) {}
    return null;
  }

  resolveModuleFromDirIfExists(
    dirname: Config.Path,
    moduleName: string,
    options?: Resolver.ResolveModuleConfig,
  ): Config.Path | null {
    const paths = (options && options.paths) || this._options.modulePaths;
    const moduleDirectory = this._options.moduleDirectories;
    const key = dirname + path.delimiter + moduleName;
    const defaultPlatform = this._options.defaultPlatform;
    const extensions = this._options.extensions.slice();
    let module;

    if (this._supportsNativePlatform) {
      extensions.unshift(
        ...this._options.extensions.map(ext => '.' + NATIVE_PLATFORM + ext),
      );
    }
    if (defaultPlatform) {
      extensions.unshift(
        ...this._options.extensions.map(ext => '.' + defaultPlatform + ext),
      );
    }

    // 1. If we have already resolved this module for this directory name,
    // return a value from the cache.
    const cacheResult = this._moduleNameCache.get(key);
    if (cacheResult) {
      return cacheResult;
    }

    // 2. Check if the module is a haste module.
    module = this.getModule(moduleName);
    if (module) {
      this._moduleNameCache.set(key, module);
      return module;
    }

    // 3. Check if the module is a node module and resolve it based on
    // the node module resolution algorithm. If skipNodeResolution is given we
    // ignore all modules that look like node modules (ie. are not relative
    // requires). This enables us to speed up resolution when we build a
    // dependency graph because we don't have to look at modules that may not
    // exist and aren't mocked.
    const skipResolution =
      options && options.skipNodeResolution && !moduleName.includes(path.sep);

    const resolveNodeModule = (name: Config.Path) =>
      Resolver.findNodeModule(name, {
        basedir: dirname,
        browser: this._options.browser,
        extensions,
        moduleDirectory,
        paths,
        resolver: this._options.resolver,
        rootDir: this._options.rootDir,
      });

    if (!skipResolution) {
      module = resolveNodeModule(moduleName);

      if (module) {
        this._moduleNameCache.set(key, module);
        return module;
      }
    }

    // 4. Resolve "haste packages" which are `package.json` files outside of
    // `node_modules` folders anywhere in the file system.
    const parts = moduleName.split('/');
    const hastePackage = this.getPackage(parts.shift()!);
    if (hastePackage) {
      try {
        const module = path.join.apply(
          path,
          [path.dirname(hastePackage)].concat(parts),
        );
        // try resolving with custom resolver first to support extensions,
        // then fallback to require.resolve
        const resolvedModule =
          resolveNodeModule(module) || require.resolve(module);
        this._moduleNameCache.set(key, resolvedModule);
        return resolvedModule;
      } catch (ignoredError) {}
    }

    return null;
  }

  resolveModule(
    from: Config.Path,
    moduleName: string,
    options?: Resolver.ResolveModuleConfig,
  ): Config.Path {
    const dirname = path.dirname(from);
    const module =
      this.resolveStubModuleName(from, moduleName) ||
      this.resolveModuleFromDirIfExists(dirname, moduleName, options);
    if (module) return module;

    // 5. Throw an error if the module could not be found. `resolve.sync` only
    // produces an error based on the dirname but we have the actual current
    // module name available.
    const relativePath = path.relative(dirname, from);
    const err: Error & {code?: string} = new Error(
      `Cannot find module '${moduleName}' from '${relativePath || '.'}'`,
    );
    err.code = 'MODULE_NOT_FOUND';
    throw err;
  }

  isCoreModule(moduleName: string): boolean {
    return this._options.hasCoreModules && isBuiltinModule(moduleName);
  }

  getModule(name: string): Config.Path | null {
    return this._moduleMap.getModule(
      name,
      this._options.defaultPlatform,
      this._supportsNativePlatform,
    );
  }

  getModulePath(from: Config.Path, moduleName: string) {
    if (moduleName[0] !== '.' || path.isAbsolute(moduleName)) {
      return moduleName;
    }
    return path.normalize(path.dirname(from) + '/' + moduleName);
  }

  getPackage(name: string): Config.Path | null {
    return this._moduleMap.getPackage(
      name,
      this._options.defaultPlatform,
      this._supportsNativePlatform,
    );
  }

  getMockModule(from: Config.Path, name: string): Config.Path | null {
    const mock = this._moduleMap.getMockModule(name);
    if (mock) {
      return mock;
    } else {
      const moduleName = this.resolveStubModuleName(from, name);
      if (moduleName) {
        return this.getModule(moduleName) || moduleName;
      }
    }
    return null;
  }

  getModulePaths(from: Config.Path): Array<Config.Path> {
    const cachedModule = this._modulePathCache.get(from);
    if (cachedModule) {
      return cachedModule;
    }

    const moduleDirectory = this._options.moduleDirectories;
    const paths = nodeModulesPaths(from, {moduleDirectory});
    if (paths[paths.length - 1] === undefined) {
      // circumvent node-resolve bug that adds `undefined` as last item.
      paths.pop();
    }
    this._modulePathCache.set(from, paths);
    return paths;
  }

  getModuleID(
    virtualMocks: BooleanObject,
    from: Config.Path,
    _moduleName?: string,
  ): string {
    const moduleName = _moduleName || '';

    const key = from + path.delimiter + moduleName;
    const cachedModuleID = this._moduleIDCache.get(key);
    if (cachedModuleID) {
      return cachedModuleID;
    }

    const moduleType = this._getModuleType(moduleName);
    const absolutePath = this._getAbsolutePath(virtualMocks, from, moduleName);
    const mockPath = this._getMockPath(from, moduleName);

    const sep = path.delimiter;
    const id =
      moduleType +
      sep +
      (absolutePath ? absolutePath + sep : '') +
      (mockPath ? mockPath + sep : '');

    this._moduleIDCache.set(key, id);
    return id;
  }

  private _getModuleType(moduleName: string): 'node' | 'user' {
    return this.isCoreModule(moduleName) ? 'node' : 'user';
  }

  private _getAbsolutePath(
    virtualMocks: BooleanObject,
    from: Config.Path,
    moduleName: string,
  ): Config.Path | null {
    if (this.isCoreModule(moduleName)) {
      return moduleName;
    }
    return this._isModuleResolved(from, moduleName)
      ? this.getModule(moduleName)
      : this._getVirtualMockPath(virtualMocks, from, moduleName);
  }

  private _getMockPath(
    from: Config.Path,
    moduleName: string,
  ): Config.Path | null {
    return !this.isCoreModule(moduleName)
      ? this.getMockModule(from, moduleName)
      : null;
  }

  private _getVirtualMockPath(
    virtualMocks: BooleanObject,
    from: Config.Path,
    moduleName: string,
  ): Config.Path {
    const virtualMockPath = this.getModulePath(from, moduleName);
    return virtualMocks[virtualMockPath]
      ? virtualMockPath
      : moduleName
      ? this.resolveModule(from, moduleName)
      : from;
  }

  private _isModuleResolved(from: Config.Path, moduleName: string): boolean {
    return !!(
      this.getModule(moduleName) || this.getMockModule(from, moduleName)
    );
  }

  resolveStubModuleName(
    from: Config.Path,
    moduleName: string,
  ): Config.Path | null {
    const dirname = path.dirname(from);
    const paths = this._options.modulePaths;
    const extensions = this._options.extensions.slice();
    const moduleDirectory = this._options.moduleDirectories;
    const moduleNameMapper = this._options.moduleNameMapper;
    const resolver = this._options.resolver;
    const defaultPlatform = this._options.defaultPlatform;

    if (this._supportsNativePlatform) {
      extensions.unshift(
        ...this._options.extensions.map(ext => '.' + NATIVE_PLATFORM + ext),
      );
    }

    if (defaultPlatform) {
      extensions.unshift(
        ...this._options.extensions.map(ext => '.' + defaultPlatform + ext),
      );
    }

    if (moduleNameMapper) {
      for (const {moduleName: mappedModuleName, regex} of moduleNameMapper) {
        if (regex.test(moduleName)) {
          // Note: once a moduleNameMapper matches the name, it must result
          // in a module, or else an error is thrown.
          const matches = moduleName.match(regex);
          const updatedName = matches
            ? mappedModuleName.replace(
                /\$([0-9]+)/g,
                (_, index) => matches[parseInt(index, 10)],
              )
            : mappedModuleName;

          const module =
            this.getModule(updatedName) ||
            Resolver.findNodeModule(updatedName, {
              basedir: dirname,
              browser: this._options.browser,
              extensions,
              moduleDirectory,
              paths,
              resolver,
              rootDir: this._options.rootDir,
            });
          if (!module) {
            throw createNoMappedModuleFoundError(
              moduleName,
              updatedName,
              mappedModuleName,
              regex,
              resolver,
            );
          }
          return module;
        }
      }
    }
    return null;
  }
}

const createNoMappedModuleFoundError = (
  moduleName: string,
  updatedName: string,
  mappedModuleName: string,
  regex: RegExp,
  resolver?: Function | string | null,
) => {
  const error = new Error(
    chalk.red(`${chalk.bold('Configuration error')}:

Could not locate module ${chalk.bold(moduleName)} mapped as:
${chalk.bold(updatedName)}.

Please check your configuration for these entries:
{
  "moduleNameMapper": {
    "${regex.toString()}": "${chalk.bold(mappedModuleName)}"
  },
  "resolver": ${chalk.bold(String(resolver))}
}`),
  );

  error.name = '';

  return error;
};

export = Resolver;
