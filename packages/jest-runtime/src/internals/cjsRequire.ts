/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import nativeModule from 'node:module';
import * as path from 'node:path';
import {URL, fileURLToPath} from 'node:url';
import type {JestEnvironment} from '@jest/environment';
import Resolver from 'jest-resolve';
import {protectProperties} from 'jest-util';
import {createOutsideJestVmPath} from '../helpers';
import type {ModuleRegistries} from './ModuleRegistries';
import type {Resolution} from './Resolution';
import type {TestMainModule} from './TestMainModule';
import type {TransformOptions} from './TransformCache';
import type {InitialModule} from './moduleTypes';

export const JEST_RESOLVE_OUTSIDE_VM_OPTION = Symbol.for(
  'jest-resolve-outside-vm-option',
);

export type ResolveOptions = Parameters<typeof require.resolve>[1] & {
  [JEST_RESOLVE_OUTSIDE_VM_OPTION]?: true;
};

export interface RequireBuilderOptions {
  resolution: Resolution;
  registries: ModuleRegistries;
  testMainModule: TestMainModule;
  requireDispatch: (from: string, moduleName: string) => unknown;
  requireInternal: (from: string, moduleName: string) => unknown;
}

export class RequireBuilder {
  private readonly resolution: Resolution;
  private readonly registries: ModuleRegistries;
  private readonly testMainModule: TestMainModule;
  private readonly requireDispatch: (
    from: string,
    moduleName: string,
  ) => unknown;
  private readonly requireInternal: (
    from: string,
    moduleName: string,
  ) => unknown;

  constructor(options: RequireBuilderOptions) {
    this.resolution = options.resolution;
    this.registries = options.registries;
    this.testMainModule = options.testMainModule;
    this.requireDispatch = options.requireDispatch;
    this.requireInternal = options.requireInternal;
  }

  for(
    from: InitialModule,
    options: TransformOptions | undefined,
  ): NodeJS.Require {
    const resolveImpl = (
      moduleName: string,
      resolveOptions?: ResolveOptions,
    ) => {
      const resolved = this.resolve(from.filename, moduleName, resolveOptions);
      if (
        resolveOptions?.[JEST_RESOLVE_OUTSIDE_VM_OPTION] &&
        options?.isInternalModule
      ) {
        return createOutsideJestVmPath(resolved);
      }
      return resolved;
    };
    resolveImpl.paths = (moduleName: string) =>
      this.resolvePaths(from.filename, moduleName);

    const moduleRequire = (
      options?.isInternalModule
        ? (moduleName: string) =>
            this.requireInternal(from.filename, moduleName)
        : (moduleName: string) =>
            this.requireDispatch(from.filename, moduleName)
    ) as NodeJS.Require;
    moduleRequire.extensions = Object.create(null);
    moduleRequire.resolve = resolveImpl;
    moduleRequire.cache = this.registries.createRequireCacheProxy();

    Object.defineProperty(moduleRequire, 'main', {
      enumerable: true,
      value: this.testMainModule.current,
    });

    return moduleRequire;
  }

  forFilename(filename: string): NodeJS.Require {
    return this.for(
      {
        children: [],
        exports: {},
        filename,
        id: filename,
        isPreloading: false,
        loaded: false,
        path: path.dirname(filename),
      },
      undefined,
    );
  }

  private resolve(
    from: string,
    moduleName: string | undefined,
    options: ResolveOptions = {},
  ): string {
    if (moduleName == null) {
      throw new Error(
        'The first argument to require.resolve must be a string. Received null or undefined.',
      );
    }

    if (path.isAbsolute(moduleName)) {
      const module = this.resolution.resolveCjsFromDirIfExists(
        moduleName,
        moduleName,
        [],
      );
      if (module) {
        return module;
      }
    } else if (options.paths) {
      for (const searchPath of options.paths) {
        const absolutePath = path.resolve(from, '..', searchPath);
        // required to also resolve files without leading './' directly in the path
        const module = this.resolution.resolveCjsFromDirIfExists(
          absolutePath,
          moduleName,
          [absolutePath],
        );
        if (module) {
          return module;
        }
      }

      throw new Resolver.ModuleNotFoundError(
        `Cannot resolve module '${moduleName}' from paths ['${options.paths.join(
          "', '",
        )}'] from ${from}`,
      );
    }

    try {
      return this.resolution.resolveCjs(from, moduleName);
    } catch (error) {
      const module = this.resolution.getCjsMockModule(from, moduleName);
      if (module) {
        return module;
      }
      throw error;
    }
  }

  private resolvePaths(
    from: string,
    moduleName: string | undefined,
  ): Array<string> | null {
    const fromDir = path.resolve(from, '..');
    if (moduleName == null) {
      throw new Error(
        'The first argument to require.resolve.paths must be a string. Received null or undefined.',
      );
    }
    if (moduleName.length === 0) {
      throw new Error(
        'The first argument to require.resolve.paths must not be the empty string.',
      );
    }

    if (moduleName[0] === '.') {
      return [fromDir];
    }
    if (this.resolution.isCoreModule(moduleName)) {
      return null;
    }
    const modulePaths = this.resolution.getModulePaths(fromDir);
    const globalPaths = this.resolution.getGlobalPaths(moduleName);
    return [...modulePaths, ...globalPaths];
  }
}

export interface CoreModuleProviderOptions {
  resolution: Resolution;
  environment: JestEnvironment;
  requireBuilder: RequireBuilder;
}

export class CoreModuleProvider {
  private mockedModuleClass?: typeof nativeModule.Module;
  private readonly resolution: Resolution;
  private readonly environment: JestEnvironment;
  private readonly requireBuilder: RequireBuilder;

  constructor(options: CoreModuleProviderOptions) {
    this.resolution = options.resolution;
    this.environment = options.environment;
    this.requireBuilder = options.requireBuilder;
  }

  require(moduleName: string, supportPrefix: boolean): unknown {
    const moduleWithoutNodePrefix =
      supportPrefix && this.resolution.normalizeCoreModuleSpecifier(moduleName);

    if (moduleWithoutNodePrefix === 'process') {
      return this.environment.global.process;
    }

    if (moduleWithoutNodePrefix === 'module') {
      return this.getMockedModuleClass();
    }

    const coreModule = require(moduleName);
    protectProperties(coreModule);
    return coreModule;
  }

  private getMockedModuleClass(): typeof nativeModule.Module {
    if (this.mockedModuleClass) {
      return this.mockedModuleClass;
    }

    const createRequire = (modulePath: string | URL) => {
      const filename =
        typeof modulePath === 'string'
          ? modulePath.startsWith('file:///')
            ? fileURLToPath(new URL(modulePath))
            : modulePath
          : fileURLToPath(modulePath);

      if (!path.isAbsolute(filename)) {
        const error: NodeJS.ErrnoException = new TypeError(
          `The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received '${filename}'`,
        );
        error.code = 'ERR_INVALID_ARG_TYPE';
        throw error;
      }

      return this.requireBuilder.forFilename(filename);
    };

    class Module extends nativeModule.Module {}

    for (const [key, value] of Object.entries(nativeModule.Module)) {
      // @ts-expect-error: no index signature
      Module[key] = value;
    }

    Module.Module = Module;

    if ('createRequire' in nativeModule) {
      Module.createRequire = createRequire;
    }
    if ('syncBuiltinESMExports' in nativeModule) {
      // cast since TS seems very confused about whether it exists or not
      (Module as any).syncBuiltinESMExports =
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        function syncBuiltinESMExports() {};
    }

    this.mockedModuleClass = Module;
    return Module;
  }

  reset(): void {
    this.mockedModuleClass = undefined;
  }
}
