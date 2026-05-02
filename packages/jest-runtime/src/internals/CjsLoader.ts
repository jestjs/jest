/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import type {Module as VMModule} from 'node:vm';
import type {JestEnvironment, Module} from '@jest/environment';
import type {MockState} from './MockState';
import {type ModuleExecutor, isCjsParseError} from './ModuleExecutor';
import type {ModuleRegistries} from './ModuleRegistries';
import type {Resolution} from './Resolution';
import type {TransformCache, TransformOptions} from './TransformCache';
import type {CoreModuleProvider} from './cjsRequire';
import type {InitialModule, ModuleRegistry} from './moduleTypes';
import {
  runtimeSupportsVmModules,
  supportsNodeColonModulePrefixInRequire,
  supportsSyncEvaluate,
} from './nodeCapabilities';

export type TestState = 'loading' | 'inTest' | 'betweenTests' | 'tornDown';

export interface CjsLoaderDeps {
  resolution: Resolution;
  registries: ModuleRegistries;
  mockState: MockState;
  transformCache: TransformCache;
  environment: JestEnvironment;
  coreModule: CoreModuleProvider;
  executor: ModuleExecutor;
  requireEsm: <T>(modulePath: string) => T;
  getTestState: () => TestState;
  logFormattedReferenceError: (msg: string) => void;
}

export class CjsLoader {
  private readonly deps: CjsLoaderDeps;

  constructor(deps: CjsLoaderDeps) {
    this.deps = deps;
  }

  requireModule<T = unknown>(
    from: string,
    moduleName?: string,
    options?: TransformOptions,
    isRequireActual = false,
  ): T {
    const {
      mockState,
      registries,
      resolution,
      coreModule,
      executor,
      requireEsm,
    } = this.deps;
    const isInternal = options?.isInternalModule ?? false;
    const moduleID = mockState.getCjsModuleId(from, moduleName);
    let modulePath: string | undefined;

    // Some old tests rely on this mocking behavior. Ideally we'll change this
    // to be more explicit.
    const moduleResource = moduleName && resolution.getModule(moduleName);
    const manualMock =
      moduleName && resolution.getCjsMockModule(from, moduleName);
    if (
      !options?.isInternalModule &&
      !isRequireActual &&
      !moduleResource &&
      manualMock &&
      manualMock !== executor.getCurrentlyExecutingManualMock() &&
      !mockState.isExplicitlyUnmocked(moduleID)
    ) {
      modulePath = manualMock;
    }

    if (moduleName && resolution.isCoreModule(moduleName)) {
      return coreModule.require(
        moduleName,
        supportsNodeColonModulePrefixInRequire,
      ) as T;
    }

    if (!modulePath) {
      modulePath = resolution.resolveCjs(from, moduleName);
    }

    if (resolution.shouldLoadAsEsm(modulePath)) {
      if (!supportsSyncEvaluate) {
        const error: NodeJS.ErrnoException = new Error(
          `Must use import to load ES Module: ${modulePath}\n` +
            "Jest's require(ESM) requires Node v24.9+ for " +
            'synchronous vm module APIs; the current Node version does not ' +
            'expose them.',
        );
        error.code = 'ERR_REQUIRE_ESM';
        throw error;
      }
      // Fast path: skip the graph walker on cache hits.
      const reg = registries.getActiveEsmRegistry();
      const cached = reg.get(modulePath);
      if (cached && !(cached instanceof Promise)) {
        return (cached as VMModule).namespace as T;
      }
      return requireEsm<T>(modulePath);
    }

    const moduleRegistry = registries.getActiveCjsRegistry(isInternal);

    const module = moduleRegistry.get(modulePath);
    if (module) {
      return (module as Module).exports;
    }

    // We must register the pre-allocated module object first so that any
    // circular dependencies that may arise while evaluating the module can
    // be satisfied.
    const localModule: InitialModule = {
      children: [],
      exports: {},
      filename: modulePath,
      id: modulePath,
      isPreloading: false,
      loaded: false,
      path: path.dirname(modulePath),
    };
    moduleRegistry.set(modulePath, localModule);

    try {
      this.loadModule(
        localModule,
        from,
        moduleName,
        modulePath,
        options,
        moduleRegistry,
      );
    } catch (error) {
      moduleRegistry.delete(modulePath);
      // Mirror of `loadCjsAsEsm`'s SyntaxError fallback for `require()`.
      if (supportsSyncEvaluate && isCjsParseError(error)) {
        try {
          return requireEsm<T>(modulePath);
        } catch (esmError) {
          if (esmError instanceof Error && esmError.name === 'SyntaxError') {
            throw error;
          }
          throw esmError;
        }
      }
      throw error;
    }

    return localModule.exports;
  }

  loadModule(
    localModule: InitialModule,
    from: string,
    moduleName: string | undefined,
    modulePath: string,
    options: TransformOptions | undefined,
    moduleRegistry: ModuleRegistry,
  ): void {
    const {
      transformCache,
      environment,
      executor,
      getTestState,
      logFormattedReferenceError,
    } = this.deps;
    if (path.extname(modulePath) === '.json') {
      const transformed = transformCache.transformJson(modulePath, options);
      localModule.exports = environment.global.JSON.parse(transformed);
    } else if (path.extname(modulePath) === '.node') {
      localModule.exports = require(modulePath);
    } else {
      // testState gates apply only to executing JS bodies — JSON/.node go
      // through pure data parsing and don't run user code in the VM.
      if (getTestState() === 'tornDown') {
        logFormattedReferenceError(
          'You are trying to `require` a file after the Jest environment has been torn down.',
        );
        process.exitCode = 1;
        return;
      }
      if (getTestState() === 'betweenTests' && !runtimeSupportsVmModules) {
        throw new ReferenceError(
          'You are trying to `require` a file outside of the scope of the test code.',
        );
      }
      // Only include the fromPath if a moduleName is given. Else treat as root.
      const fromPath = moduleName ? from : null;
      const result = executor.exec(
        localModule,
        options,
        moduleRegistry,
        fromPath,
        moduleName,
      );
      if (result === 'env-disposed') {
        logFormattedReferenceError(
          'You are trying to `require` a file after the Jest environment has been torn down.',
        );
        process.exitCode = 1;
        return;
      }
    }
    localModule.loaded = true;
  }
}
