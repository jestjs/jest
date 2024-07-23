/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as pico from 'picocolors';
import slash = require('slash');
import type {IModuleMap} from 'jest-haste-map';
import {tryRealpath} from 'jest-util';
import ModuleNotFoundError from './ModuleNotFoundError';
import defaultResolver, {
  type AsyncResolver,
  type Resolver as ResolverInterface,
  type SyncResolver,
} from './defaultResolver';
import {clearFsCache} from './fileWalkers';
import isBuiltinModule from './isBuiltinModule';
import nodeModulesPaths, {GlobalPaths} from './nodeModulesPaths';
import shouldLoadAsEsm, {clearCachedLookups} from './shouldLoadAsEsm';
import type {ResolverConfig} from './types';

export type FindNodeModuleConfig = {
  basedir: string;
  conditions?: Array<string>;
  extensions?: Array<string>;
  moduleDirectory?: Array<string>;
  paths?: Array<string>;
  resolver?: string | null;
  rootDir?: string;
  throwIfNotFound?: boolean;
};

export type ResolveModuleConfig = {
  conditions?: Array<string>;
  skipNodeResolution?: boolean;
  paths?: Array<string>;
};

const NATIVE_PLATFORM = 'native';

// We might be inside a symlink.
const resolvedCwd = tryRealpath(process.cwd());
const {NODE_PATH} = process.env;
const nodePaths = NODE_PATH
  ? NODE_PATH.split(path.delimiter)
      .filter(Boolean)
      // The resolver expects absolute paths.
      .map(p => path.resolve(resolvedCwd, p))
  : undefined;

export default class Resolver {
  private readonly _options: ResolverConfig;
  private readonly _moduleMap: IModuleMap;
  private readonly _moduleIDCache: Map<string, string>;
  private readonly _moduleNameCache: Map<string, string>;
  private readonly _modulePathCache: Map<string, Array<string>>;
  private readonly _supportsNativePlatform: boolean;

  constructor(moduleMap: IModuleMap, options: ResolverConfig) {
    this._options = {
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

  static ModuleNotFoundError = ModuleNotFoundError;

  static tryCastModuleNotFoundError(
    error: unknown,
  ): ModuleNotFoundError | null {
    if (error instanceof ModuleNotFoundError) {
      return error;
    }

    const casted = error as ModuleNotFoundError;
    if (casted.code === 'MODULE_NOT_FOUND') {
      return ModuleNotFoundError.duckType(casted);
    }

    return null;
  }

  static clearDefaultResolverCache(): void {
    clearFsCache();
    clearCachedLookups();
  }

  static findNodeModule(
    path: string,
    options: FindNodeModuleConfig,
  ): string | null {
    const resolverModule = loadResolver(options.resolver);
    let resolver: SyncResolver = defaultResolver;

    if (typeof resolverModule === 'function') {
      resolver = resolverModule;
    } else if (typeof resolverModule.sync === 'function') {
      resolver = resolverModule.sync;
    }

    const paths = options.paths;

    try {
      return resolver(path, {
        basedir: options.basedir,
        conditions: options.conditions,
        defaultResolver,
        extensions: options.extensions,
        moduleDirectory: options.moduleDirectory,
        paths: paths ? [...(nodePaths || []), ...paths] : nodePaths,
        rootDir: options.rootDir,
      });
    } catch (error) {
      // we always wanna throw if it's an internal import
      if (options.throwIfNotFound || path.startsWith('#')) {
        throw error;
      }
    }
    return null;
  }

  static async findNodeModuleAsync(
    path: string,
    options: FindNodeModuleConfig,
  ): Promise<string | null> {
    const resolverModule = loadResolver(options.resolver);
    let resolver: ResolverInterface = defaultResolver;

    if (typeof resolverModule === 'function') {
      resolver = resolverModule;
    } else if (
      typeof resolverModule.async === 'function' ||
      typeof resolverModule.sync === 'function'
    ) {
      const asyncOrSync = resolverModule.async || resolverModule.sync;

      if (asyncOrSync == null) {
        throw new Error(`Unable to load resolver at ${options.resolver}`);
      }

      resolver = asyncOrSync;
    }

    const paths = options.paths;

    try {
      const result = await resolver(path, {
        basedir: options.basedir,
        conditions: options.conditions,
        defaultResolver,
        extensions: options.extensions,
        moduleDirectory: options.moduleDirectory,
        paths: paths ? [...(nodePaths || []), ...paths] : nodePaths,
        rootDir: options.rootDir,
      });
      return result;
    } catch (error: unknown) {
      // we always wanna throw if it's an internal import
      if (options.throwIfNotFound || path.startsWith('#')) {
        throw error;
      }
    }
    return null;
  }

  // unstable as it should be replaced by https://github.com/nodejs/modules/issues/393, and we don't want people to use it
  static unstable_shouldLoadAsEsm = shouldLoadAsEsm;

  resolveModuleFromDirIfExists(
    dirname: string,
    moduleName: string,
    options?: ResolveModuleConfig,
  ): string | null {
    const {extensions, key, moduleDirectory, paths, skipResolution} =
      this._prepareForResolution(dirname, moduleName, options);

    let module;

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
    const resolveNodeModule = (name: string, throwIfNotFound = false) => {
      // Only skip default resolver
      if (this.isCoreModule(name) && !this._options.resolver) {
        return name;
      }

      return Resolver.findNodeModule(name, {
        basedir: dirname,
        conditions: options?.conditions,
        extensions,
        moduleDirectory,
        paths,
        resolver: this._options.resolver,
        rootDir: this._options.rootDir,
        throwIfNotFound,
      });
    };

    if (!skipResolution) {
      module = resolveNodeModule(moduleName, Boolean(process.versions.pnp));

      if (module) {
        this._moduleNameCache.set(key, module);
        return module;
      }
    }

    // 4. Resolve "haste packages" which are `package.json` files outside of
    // `node_modules` folders anywhere in the file system.
    try {
      const hasteModulePath = this._getHasteModulePath(moduleName);
      if (hasteModulePath) {
        // try resolving with custom resolver first to support extensions,
        // then fallback to require.resolve
        const resolvedModule =
          resolveNodeModule(hasteModulePath) ||
          require.resolve(hasteModulePath);
        this._moduleNameCache.set(key, resolvedModule);
        return resolvedModule;
      }
    } catch {}

    return null;
  }

  async resolveModuleFromDirIfExistsAsync(
    dirname: string,
    moduleName: string,
    options?: ResolveModuleConfig,
  ): Promise<string | null> {
    const {extensions, key, moduleDirectory, paths, skipResolution} =
      this._prepareForResolution(dirname, moduleName, options);

    let module;

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
    const resolveNodeModule = async (name: string, throwIfNotFound = false) => {
      // Only skip default resolver
      if (this.isCoreModule(name) && !this._options.resolver) {
        return name;
      }

      return Resolver.findNodeModuleAsync(name, {
        basedir: dirname,
        conditions: options?.conditions,
        extensions,
        moduleDirectory,
        paths,
        resolver: this._options.resolver,
        rootDir: this._options.rootDir,
        throwIfNotFound,
      });
    };

    if (!skipResolution) {
      module = await resolveNodeModule(
        moduleName,
        Boolean(process.versions.pnp),
      );

      if (module) {
        this._moduleNameCache.set(key, module);
        return module;
      }
    }

    // 4. Resolve "haste packages" which are `package.json` files outside of
    // `node_modules` folders anywhere in the file system.
    try {
      const hasteModulePath = this._getHasteModulePath(moduleName);
      if (hasteModulePath) {
        // try resolving with custom resolver first to support extensions,
        // then fallback to require.resolve
        const resolvedModule =
          (await resolveNodeModule(hasteModulePath)) ||
          // QUESTION: should this be async?
          require.resolve(hasteModulePath);
        this._moduleNameCache.set(key, resolvedModule);
        return resolvedModule;
      }
    } catch {}

    return null;
  }

  resolveModule(
    from: string,
    moduleName: string,
    options?: ResolveModuleConfig,
  ): string {
    const dirname = path.dirname(from);
    const module =
      this.resolveStubModuleName(from, moduleName) ||
      this.resolveModuleFromDirIfExists(dirname, moduleName, options);
    if (module) return module;

    // 5. Throw an error if the module could not be found. `resolve.sync` only
    // produces an error based on the dirname but we have the actual current
    // module name available.
    this._throwModNotFoundError(from, moduleName);
  }

  async resolveModuleAsync(
    from: string,
    moduleName: string,
    options?: ResolveModuleConfig,
  ): Promise<string> {
    const dirname = path.dirname(from);
    const module =
      (await this.resolveStubModuleNameAsync(from, moduleName)) ||
      (await this.resolveModuleFromDirIfExistsAsync(
        dirname,
        moduleName,
        options,
      ));

    if (module) return module;

    // 5. Throw an error if the module could not be found. `resolve` only
    // produces an error based on the dirname but we have the actual current
    // module name available.
    this._throwModNotFoundError(from, moduleName);
  }

  /**
   * _prepareForResolution is shared between the sync and async module resolution
   * methods, to try to keep them as DRY as possible.
   */
  private _prepareForResolution(
    dirname: string,
    moduleName: string,
    options?: ResolveModuleConfig,
  ) {
    const paths = options?.paths || this._options.modulePaths;
    const moduleDirectory = this._options.moduleDirectories;
    const stringifiedOptions = options ? JSON.stringify(options) : '';
    const key = dirname + path.delimiter + moduleName + stringifiedOptions;
    const defaultPlatform = this._options.defaultPlatform;
    const extensions = [...this._options.extensions];

    if (this._supportsNativePlatform) {
      extensions.unshift(
        ...this._options.extensions.map(ext => `.${NATIVE_PLATFORM}${ext}`),
      );
    }
    if (defaultPlatform) {
      extensions.unshift(
        ...this._options.extensions.map(ext => `.${defaultPlatform}${ext}`),
      );
    }

    const skipResolution =
      options && options.skipNodeResolution && !moduleName.includes(path.sep);

    return {extensions, key, moduleDirectory, paths, skipResolution};
  }

  /**
   * _getHasteModulePath attempts to return the path to a haste module.
   */
  private _getHasteModulePath(moduleName: string) {
    const parts = moduleName.split('/');
    const hastePackage = this.getPackage(parts.shift()!);
    if (hastePackage) {
      return path.join(path.dirname(hastePackage), ...parts);
    }
    return null;
  }

  private _throwModNotFoundError(from: string, moduleName: string): never {
    const relativePath =
      slash(path.relative(this._options.rootDir, from)) || '.';

    throw new ModuleNotFoundError(
      `Cannot find module '${moduleName}' from '${relativePath}'`,
      moduleName,
    );
  }

  private _getMapModuleName(matches: RegExpMatchArray | null) {
    return matches
      ? (moduleName: string) =>
          moduleName.replaceAll(
            /\$(\d+)/g,
            (_, index) => matches[Number.parseInt(index, 10)] || '',
          )
      : (moduleName: string) => moduleName;
  }

  private _isAliasModule(moduleName: string): boolean {
    const moduleNameMapper = this._options.moduleNameMapper;
    if (!moduleNameMapper) {
      return false;
    }

    return moduleNameMapper.some(({regex}) => regex.test(moduleName));
  }

  isCoreModule(moduleName: string): boolean {
    return (
      this._options.hasCoreModules &&
      (isBuiltinModule(moduleName) || moduleName.startsWith('node:')) &&
      !this._isAliasModule(moduleName)
    );
  }

  getModule(name: string): string | null {
    return this._moduleMap.getModule(
      name,
      this._options.defaultPlatform,
      this._supportsNativePlatform,
    );
  }

  getModulePath(from: string, moduleName: string): string {
    if (moduleName[0] !== '.' || path.isAbsolute(moduleName)) {
      return moduleName;
    }
    return path.normalize(`${path.dirname(from)}/${moduleName}`);
  }

  getPackage(name: string): string | null {
    return this._moduleMap.getPackage(
      name,
      this._options.defaultPlatform,
      this._supportsNativePlatform,
    );
  }

  getMockModule(from: string, name: string): string | null {
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

  async getMockModuleAsync(from: string, name: string): Promise<string | null> {
    const mock = this._moduleMap.getMockModule(name);
    if (mock) {
      return mock;
    } else {
      const moduleName = await this.resolveStubModuleNameAsync(from, name);
      if (moduleName) {
        return this.getModule(moduleName) || moduleName;
      }
    }
    return null;
  }

  getModulePaths(from: string): Array<string> {
    const cachedModule = this._modulePathCache.get(from);
    if (cachedModule) {
      return cachedModule;
    }

    const moduleDirectory = this._options.moduleDirectories;
    const paths = nodeModulesPaths(from, {moduleDirectory});
    if (paths.at(-1) === undefined) {
      // circumvent node-resolve bug that adds `undefined` as last item.
      paths.pop();
    }
    this._modulePathCache.set(from, paths);
    return paths;
  }

  getGlobalPaths(moduleName?: string): Array<string> {
    if (!moduleName || moduleName[0] === '.' || this.isCoreModule(moduleName)) {
      return [];
    }

    return GlobalPaths;
  }

  getModuleID(
    virtualMocks: Map<string, boolean>,
    from: string,
    moduleName = '',
    options?: ResolveModuleConfig,
  ): string {
    const stringifiedOptions = options ? JSON.stringify(options) : '';
    const key = from + path.delimiter + moduleName + stringifiedOptions;
    const cachedModuleID = this._moduleIDCache.get(key);
    if (cachedModuleID) {
      return cachedModuleID;
    }

    const moduleType = this._getModuleType(moduleName);
    const absolutePath = this._getAbsolutePath(
      virtualMocks,
      from,
      moduleName,
      options,
    );
    const mockPath = this._getMockPath(from, moduleName);

    const sep = path.delimiter;
    const id =
      moduleType +
      sep +
      (absolutePath ? absolutePath + sep : '') +
      (mockPath ? mockPath + sep : '') +
      (stringifiedOptions ? stringifiedOptions + sep : '');

    this._moduleIDCache.set(key, id);
    return id;
  }

  async getModuleIDAsync(
    virtualMocks: Map<string, boolean>,
    from: string,
    moduleName = '',
    options?: ResolveModuleConfig,
  ): Promise<string> {
    const stringifiedOptions = options ? JSON.stringify(options) : '';
    const key = from + path.delimiter + moduleName + stringifiedOptions;
    const cachedModuleID = this._moduleIDCache.get(key);
    if (cachedModuleID) {
      return cachedModuleID;
    }
    if (moduleName.startsWith('data:')) {
      return moduleName;
    }

    const moduleType = this._getModuleType(moduleName);
    const absolutePath = await this._getAbsolutePathAsync(
      virtualMocks,
      from,
      moduleName,
      options,
    );
    const mockPath = await this._getMockPathAsync(from, moduleName);

    const sep = path.delimiter;
    const id =
      moduleType +
      sep +
      (absolutePath ? absolutePath + sep : '') +
      (mockPath ? mockPath + sep : '') +
      (stringifiedOptions ? stringifiedOptions + sep : '');

    this._moduleIDCache.set(key, id);
    return id;
  }

  private _getModuleType(moduleName: string): 'node' | 'user' {
    return this.isCoreModule(moduleName) ? 'node' : 'user';
  }

  private _getAbsolutePath(
    virtualMocks: Map<string, boolean>,
    from: string,
    moduleName: string,
    options?: ResolveModuleConfig,
  ): string | null {
    if (this.isCoreModule(moduleName)) {
      return moduleName;
    }
    if (moduleName.startsWith('data:')) {
      return moduleName;
    }
    return this._isModuleResolved(from, moduleName)
      ? this.getModule(moduleName)
      : this._getVirtualMockPath(virtualMocks, from, moduleName, options);
  }

  private async _getAbsolutePathAsync(
    virtualMocks: Map<string, boolean>,
    from: string,
    moduleName: string,
    options?: ResolveModuleConfig,
  ): Promise<string | null> {
    if (this.isCoreModule(moduleName)) {
      return moduleName;
    }
    if (moduleName.startsWith('data:')) {
      return moduleName;
    }
    const isModuleResolved = await this._isModuleResolvedAsync(
      from,
      moduleName,
    );
    return isModuleResolved
      ? this.getModule(moduleName)
      : this._getVirtualMockPathAsync(virtualMocks, from, moduleName, options);
  }

  private _getMockPath(from: string, moduleName: string): string | null {
    return this.isCoreModule(moduleName)
      ? null
      : this.getMockModule(from, moduleName);
  }

  private async _getMockPathAsync(
    from: string,
    moduleName: string,
  ): Promise<string | null> {
    return this.isCoreModule(moduleName)
      ? null
      : this.getMockModuleAsync(from, moduleName);
  }

  private _getVirtualMockPath(
    virtualMocks: Map<string, boolean>,
    from: string,
    moduleName: string,
    options?: ResolveModuleConfig,
  ): string {
    const virtualMockPath = this.getModulePath(from, moduleName);
    return virtualMocks.get(virtualMockPath)
      ? virtualMockPath
      : moduleName
        ? this.resolveModule(from, moduleName, options)
        : from;
  }

  private async _getVirtualMockPathAsync(
    virtualMocks: Map<string, boolean>,
    from: string,
    moduleName: string,
    options?: ResolveModuleConfig,
  ): Promise<string> {
    const virtualMockPath = this.getModulePath(from, moduleName);
    return virtualMocks.get(virtualMockPath)
      ? virtualMockPath
      : moduleName
        ? this.resolveModuleAsync(from, moduleName, options)
        : from;
  }

  private _isModuleResolved(from: string, moduleName: string): boolean {
    return !!(
      this.getModule(moduleName) || this.getMockModule(from, moduleName)
    );
  }

  private async _isModuleResolvedAsync(
    from: string,
    moduleName: string,
  ): Promise<boolean> {
    return !!(
      this.getModule(moduleName) ||
      (await this.getMockModuleAsync(from, moduleName))
    );
  }

  resolveStubModuleName(from: string, moduleName: string): string | null {
    const dirname = path.dirname(from);

    const {extensions, moduleDirectory, paths} = this._prepareForResolution(
      dirname,
      moduleName,
    );
    const moduleNameMapper = this._options.moduleNameMapper;
    const resolver = this._options.resolver;

    if (moduleNameMapper) {
      for (const {moduleName: mappedModuleName, regex} of moduleNameMapper) {
        if (regex.test(moduleName)) {
          // Note: once a moduleNameMapper matches the name, it must result
          // in a module, or else an error is thrown.
          const matches = moduleName.match(regex);
          const mapModuleName = this._getMapModuleName(matches);
          const possibleModuleNames = Array.isArray(mappedModuleName)
            ? mappedModuleName
            : [mappedModuleName];
          let module: string | null = null;
          for (const possibleModuleName of possibleModuleNames) {
            const updatedName = mapModuleName(possibleModuleName);

            module =
              this.getModule(updatedName) ||
              Resolver.findNodeModule(updatedName, {
                basedir: dirname,
                extensions,
                moduleDirectory,
                paths,
                resolver,
                rootDir: this._options.rootDir,
              });

            if (module) {
              break;
            }
          }

          if (!module) {
            throw createNoMappedModuleFoundError(
              moduleName,
              mapModuleName,
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

  async resolveStubModuleNameAsync(
    from: string,
    moduleName: string,
  ): Promise<string | null> {
    const dirname = path.dirname(from);

    const {extensions, moduleDirectory, paths} = this._prepareForResolution(
      dirname,
      moduleName,
    );
    const moduleNameMapper = this._options.moduleNameMapper;
    const resolver = this._options.resolver;

    if (moduleNameMapper) {
      for (const {moduleName: mappedModuleName, regex} of moduleNameMapper) {
        if (regex.test(moduleName)) {
          // Note: once a moduleNameMapper matches the name, it must result
          // in a module, or else an error is thrown.
          const matches = moduleName.match(regex);
          const mapModuleName = this._getMapModuleName(matches);
          const possibleModuleNames = Array.isArray(mappedModuleName)
            ? mappedModuleName
            : [mappedModuleName];
          let module: string | null = null;
          for (const possibleModuleName of possibleModuleNames) {
            const updatedName = mapModuleName(possibleModuleName);

            module =
              this.getModule(updatedName) ||
              (await Resolver.findNodeModuleAsync(updatedName, {
                basedir: dirname,
                extensions,
                moduleDirectory,
                paths,
                resolver,
                rootDir: this._options.rootDir,
              }));

            if (module) {
              break;
            }
          }

          if (!module) {
            throw createNoMappedModuleFoundError(
              moduleName,
              mapModuleName,
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
  mapModuleName: (moduleName: string) => string,
  mappedModuleName: string | Array<string>,
  regex: RegExp,
  resolver?: ((...args: Array<unknown>) => unknown) | string | null,
) => {
  const mappedAs = Array.isArray(mappedModuleName)
    ? JSON.stringify(mappedModuleName.map(mapModuleName), null, 2)
    : mappedModuleName;
  const original = Array.isArray(mappedModuleName)
    ? `${
        JSON.stringify(mappedModuleName, null, 6) // using 6 because of misalignment when nested below
          .slice(0, -1) + ' '.repeat(4)
      }]` /// align last bracket correctly as well
    : mappedModuleName;

  const error = new Error(
    pico.red(`${pico.bold('Configuration error')}:

Could not locate module ${pico.bold(moduleName)} mapped as:
${pico.bold(mappedAs)}.

Please check your configuration for these entries:
{
  "moduleNameMapper": {
    "${regex.toString()}": "${pico.bold(original)}"
  },
  "resolver": ${pico.bold(String(resolver))}
}`),
  );

  error.name = '';

  return error;
};

type ResolverSyncObject = {sync: SyncResolver; async?: AsyncResolver};
type ResolverAsyncObject = {sync?: SyncResolver; async: AsyncResolver};
export type ResolverObject = ResolverSyncObject | ResolverAsyncObject;

function loadResolver(
  resolver: string | undefined | null,
): SyncResolver | ResolverObject {
  if (resolver == null) {
    return defaultResolver;
  }

  const loadedResolver = require(resolver);

  if (loadedResolver == null) {
    throw new Error(`Resolver located at ${resolver} does not export anything`);
  }

  if (typeof loadedResolver === 'function') {
    return loadedResolver as SyncResolver;
  }

  if (
    typeof loadedResolver === 'object' &&
    (loadedResolver.sync != null || loadedResolver.async != null)
  ) {
    return loadedResolver as ResolverObject;
  }

  throw new Error(
    `Resolver located at ${resolver} does not export a function or an object with "sync" and "async" props`,
  );
}
