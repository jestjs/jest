/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  type Context as VMContext,
  type Module as VMModule,
  compileFunction,
} from 'node:vm';
import type {
  Jest,
  JestEnvironment,
  Module,
  ModuleWrapper,
} from '@jest/environment';
import {handlePotentialSyntaxError} from '@jest/transform';
import type {Config, Global} from '@jest/types';
import Resolver from 'jest-resolve';
import {invariant, isError, isNonNullable} from 'jest-util';
import type {JestGlobals} from './JestGlobals';
import type {Resolution} from './Resolution';
import type {TestMainModule} from './TestMainModule';
import type {TransformCache, TransformOptions} from './TransformCache';
import type {RequireBuilder} from './cjsRequire';
import type {InitialModule, ModuleRegistry} from './moduleTypes';
import {runtimeSupportsVmModules} from './nodeCapabilities';

export type ExecResult = 'loaded' | 'env-disposed';

// Marker used by the CJS-as-ESM SyntaxError fallback paths to distinguish
// parse-time errors (where retrying as ESM is correct) from runtime errors
// a user might throw from inside a module body.
export const CJS_PARSE_ERROR = Symbol('jest-runtime CJS parse error');
export const isCjsParseError = (error: unknown): error is Error =>
  isError(error) &&
  (error as unknown as Record<symbol, unknown>)[CJS_PARSE_ERROR] === true;

export interface ModuleExecutorOptions {
  resolution: Resolution;
  transformCache: TransformCache;
  environment: JestEnvironment;
  config: Config.ProjectConfig;
  testPath: string;
  requireBuilder: RequireBuilder;
  testMainModule: TestMainModule;
  jestGlobals: JestGlobals;
  dynamicImport: (
    specifier: string,
    identifier: string,
    context: VMContext,
  ) => Promise<VMModule>;
}

export class ModuleExecutor {
  private readonly resolution: Resolution;
  private readonly transformCache: TransformCache;
  private readonly environment: JestEnvironment;
  private readonly config: Config.ProjectConfig;
  private readonly testPath: string;
  private readonly requireBuilder: RequireBuilder;
  private readonly testMainModule: TestMainModule;
  private readonly jestGlobals: JestGlobals;
  private readonly dynamicImport: ModuleExecutorOptions['dynamicImport'];
  private currentlyExecutingManualMock: string | null = null;

  constructor(options: ModuleExecutorOptions) {
    this.resolution = options.resolution;
    this.transformCache = options.transformCache;
    this.environment = options.environment;
    this.config = options.config;
    this.testPath = options.testPath;
    this.requireBuilder = options.requireBuilder;
    this.testMainModule = options.testMainModule;
    this.jestGlobals = options.jestGlobals;
    this.dynamicImport = options.dynamicImport;
  }

  getCurrentlyExecutingManualMock(): string | null {
    return this.currentlyExecutingManualMock;
  }

  exec(
    localModule: InitialModule,
    options: TransformOptions | undefined,
    moduleRegistry: ModuleRegistry,
    from: string | null,
    moduleName: string | undefined,
  ): ExecResult {
    if (!this.environment.global) {
      return 'env-disposed';
    }

    const module = localModule as Module;

    const filename = module.filename;
    const origCurrExecutingManualMock = this.currentlyExecutingManualMock;
    this.currentlyExecutingManualMock = filename;

    try {
      module.children = [];

      Object.defineProperty(module, 'parent', {
        enumerable: true,
        get() {
          const key = from || '';
          return moduleRegistry.get(key) || null;
        },
      });
      const modulePaths = this.resolution.getModulePaths(module.path);
      const globalPaths = this.resolution.getGlobalPaths(moduleName);
      module.paths = [...modulePaths, ...globalPaths];

      Object.defineProperty(module, 'require', {
        value: this.requireBuilder.for(localModule, options),
      });

      const transformedCode = this.transformCache.transform(filename, options);

      const compiledFunction = this.compile(transformedCode, filename);
      if (compiledFunction === null) {
        return 'env-disposed';
      }

      const jestObject = this.jestGlobals.jestObjectFor(filename);

      const lastArgs: [Jest | undefined, ...Array<Global.Global>] = [
        this.config.injectGlobals ? jestObject : undefined,
        ...this.config.sandboxInjectedGlobals.map<Global.Global>(
          globalVariable => {
            if (this.environment.global[globalVariable]) {
              return this.environment.global[globalVariable];
            }

            throw new Error(
              `You have requested '${globalVariable}' as a global variable, but it was not present. Please check your config or your global environment.`,
            );
          },
        ),
      ];

      if (!this.testMainModule.current && filename === this.testPath) {
        this.testMainModule.current = module;
      }

      Object.defineProperty(module, 'main', {
        enumerable: true,
        value: this.testMainModule.current,
      });

      try {
        compiledFunction.call(
          module.exports,
          module, // module object
          module.exports, // module exports
          module.require, // require implementation
          module.path, // __dirname
          module.filename, // __filename
          lastArgs[0],
          ...lastArgs.slice(1).filter(isNonNullable),
        );
      } catch (error: any) {
        this.handleExecutionError(error, module);
      }
    } finally {
      this.currentlyExecutingManualMock = origCurrExecutingManualMock;
    }

    return 'loaded';
  }

  private compile(
    scriptSource: string,
    filename: string,
  ): ModuleWrapper | null {
    const vmContext = this.environment.getVmContext();

    if (vmContext == null) {
      return null;
    }

    try {
      const scriptFilename = this.resolution.isCoreModule(filename)
        ? `jest-nodejs-core-${filename}`
        : filename;
      return compileFunction(
        scriptSource,
        this.constructInjectedModuleParameters(),
        {
          filename: scriptFilename,
          importModuleDynamically: async specifier => {
            invariant(
              runtimeSupportsVmModules,
              'You need to run with a version of node that supports ES Modules in the VM API. See https://jestjs.io/docs/ecmascript-modules',
            );
            return this.dynamicImport(specifier, scriptFilename, vmContext);
          },
          parsingContext: vmContext,
        },
      ) as ModuleWrapper;
    } catch (error: any) {
      // Tag so callers can distinguish parse-time SyntaxErrors (where the
      // ESM-syntax-in-CJS fallback applies) from runtime SyntaxErrors a user
      // might throw from inside a CJS module body.
      if (isError(error)) {
        (error as unknown as Record<symbol, unknown>)[CJS_PARSE_ERROR] = true;
      }
      throw handlePotentialSyntaxError(error);
    }
  }

  constructInjectedModuleParameters(): Array<string> {
    return [
      'module',
      'exports',
      'require',
      '__dirname',
      '__filename',
      this.config.injectGlobals ? 'jest' : undefined,
      ...this.config.sandboxInjectedGlobals,
    ].filter(isNonNullable);
  }

  private handleExecutionError(error: Error, module: Module): never {
    const moduleNotFoundError = Resolver.tryCastModuleNotFoundError(error);
    if (moduleNotFoundError) {
      if (!moduleNotFoundError.requireStack) {
        moduleNotFoundError.requireStack = [module.filename || module.id];

        for (let cursor = module.parent; cursor; cursor = cursor.parent) {
          moduleNotFoundError.requireStack.push(cursor.filename || cursor.id);
        }

        moduleNotFoundError.buildMessage(this.config.rootDir);
      }
      throw moduleNotFoundError;
    }

    throw error;
  }
}
