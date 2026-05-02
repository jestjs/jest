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

export interface ModuleExecutorDeps {
  resolution: Resolution;
  transformCache: TransformCache;
  environment: JestEnvironment;
  config: Config.ProjectConfig;
  testPath: string;
  requireBuilder: RequireBuilder;
  testMainModule: TestMainModule;
  jestObjectFactory: (from: string) => Jest;
  jestObjectCache: Map<string, Jest>;
  dynamicImport: (
    specifier: string,
    identifier: string,
    context: VMContext,
  ) => Promise<VMModule>;
}

// Caller is responsible for testState gating and `.json`/`.node` dispatch.
export class ModuleExecutor {
  private readonly deps: ModuleExecutorDeps;
  private currentlyExecutingManualMock: string | null = null;

  constructor(deps: ModuleExecutorDeps) {
    this.deps = deps;
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
    const {
      transformCache,
      resolution,
      environment,
      config,
      testPath,
      requireBuilder,
      testMainModule,
      jestObjectFactory,
      jestObjectCache,
    } = this.deps;

    if (!environment.global) {
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
      const modulePaths = resolution.getModulePaths(module.path);
      const globalPaths = resolution.getGlobalPaths(moduleName);
      module.paths = [...modulePaths, ...globalPaths];

      Object.defineProperty(module, 'require', {
        value: requireBuilder.for(localModule, options),
      });

      const transformedCode = transformCache.transform(filename, options);

      const compiledFunction = this.compile(transformedCode, filename);
      if (compiledFunction === null) {
        return 'env-disposed';
      }

      const jestObject = jestObjectFactory(filename);
      jestObjectCache.set(filename, jestObject);

      const lastArgs: [Jest | undefined, ...Array<Global.Global>] = [
        config.injectGlobals ? jestObject : undefined,
        ...config.sandboxInjectedGlobals.map<Global.Global>(globalVariable => {
          if (environment.global[globalVariable]) {
            return environment.global[globalVariable];
          }

          throw new Error(
            `You have requested '${globalVariable}' as a global variable, but it was not present. Please check your config or your global environment.`,
          );
        }),
      ];

      if (!testMainModule.current && filename === testPath) {
        testMainModule.current = module;
      }

      Object.defineProperty(module, 'main', {
        enumerable: true,
        value: testMainModule.current,
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
    const {environment, resolution, dynamicImport} = this.deps;
    const vmContext = environment.getVmContext();

    if (vmContext == null) {
      return null;
    }

    try {
      const scriptFilename = resolution.isCoreModule(filename)
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
            return dynamicImport(specifier, scriptFilename, vmContext);
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
    const {config} = this.deps;
    return [
      'module',
      'exports',
      'require',
      '__dirname',
      '__filename',
      config.injectGlobals ? 'jest' : undefined,
      ...config.sandboxInjectedGlobals,
    ].filter(isNonNullable);
  }

  private handleExecutionError(error: Error, module: Module): never {
    const {config} = this.deps;
    const moduleNotFoundError = Resolver.tryCastModuleNotFoundError(error);
    if (moduleNotFoundError) {
      if (!moduleNotFoundError.requireStack) {
        moduleNotFoundError.requireStack = [module.filename || module.id];

        for (let cursor = module.parent; cursor; cursor = cursor.parent) {
          moduleNotFoundError.requireStack.push(cursor.filename || cursor.id);
        }

        moduleNotFoundError.buildMessage(config.rootDir);
      }
      throw moduleNotFoundError;
    }

    throw error;
  }
}
