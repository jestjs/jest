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
import {CjsParseError, type ModuleExecutor} from './ModuleExecutor';
import type {ModuleRegistries} from './ModuleRegistries';
import type {Resolution} from './Resolution';
import type {TestState} from './TestState';
import type {TransformCache, TransformOptions} from './TransformCache';
import type {CoreModuleProvider} from './cjsRequire';
import type {InitialModule, ModuleRegistry} from './moduleTypes';
import {
  runtimeSupportsVmModules,
  supportsNodeColonModulePrefixInRequire,
  supportsSyncEvaluate,
} from './nodeCapabilities';

export interface CjsLoaderOptions {
  resolution: Resolution;
  registries: ModuleRegistries;
  mockState: MockState;
  transformCache: TransformCache;
  environment: JestEnvironment;
  coreModule: CoreModuleProvider;
  executor: ModuleExecutor;
  requireEsm: <T>(modulePath: string) => T;
  testState: TestState;
  logFormattedReferenceError: (msg: string) => void;
}

export class CjsLoader {
  private readonly resolution: Resolution;
  private readonly registries: ModuleRegistries;
  private readonly mockState: MockState;
  private readonly transformCache: TransformCache;
  private readonly environment: JestEnvironment;
  private readonly coreModule: CoreModuleProvider;
  private readonly executor: ModuleExecutor;
  private readonly requireEsm: <T>(modulePath: string) => T;
  private readonly testState: TestState;
  private readonly logFormattedReferenceError: (msg: string) => void;

  constructor(options: CjsLoaderOptions) {
    this.resolution = options.resolution;
    this.registries = options.registries;
    this.mockState = options.mockState;
    this.transformCache = options.transformCache;
    this.environment = options.environment;
    this.coreModule = options.coreModule;
    this.executor = options.executor;
    this.requireEsm = options.requireEsm;
    this.testState = options.testState;
    this.logFormattedReferenceError = options.logFormattedReferenceError;
  }

  requireModule<T = unknown>(
    from: string,
    moduleName?: string,
    options?: TransformOptions,
    isRequireActual = false,
  ): T {
    const isInternal = options?.isInternalModule ?? false;
    const moduleID = this.mockState.getCjsModuleId(from, moduleName);
    let modulePath: string | undefined;

    // Some old tests rely on this mocking behavior. Ideally we'll change this
    // to be more explicit.
    const moduleResource = moduleName && this.resolution.getModule(moduleName);
    const manualMock =
      moduleName && this.resolution.getCjsMockModule(from, moduleName);
    if (
      !options?.isInternalModule &&
      !isRequireActual &&
      !moduleResource &&
      manualMock &&
      manualMock !== this.executor.getCurrentlyExecutingManualMock() &&
      !this.mockState.isExplicitlyUnmocked(moduleID)
    ) {
      modulePath = manualMock;
    }

    if (moduleName && this.resolution.isCoreModule(moduleName)) {
      return this.coreModule.require(
        moduleName,
        supportsNodeColonModulePrefixInRequire,
      ) as T;
    }

    if (!modulePath) {
      modulePath = this.resolution.resolveCjs(from, moduleName);
    }

    if (this.resolution.shouldLoadAsEsm(modulePath)) {
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
      const reg = this.registries.getActiveEsmRegistry();
      const cached = reg.get(modulePath);
      if (cached && !(cached instanceof Promise)) {
        return (cached as VMModule).namespace as T;
      }
      return this.requireEsm<T>(modulePath);
    }

    const moduleRegistry = isInternal
      ? this.registries.getInternalCjsRegistry()
      : this.registries.getActiveCjsRegistry();

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
      // ESM-syntax-in-CJS fallback for require(): retry as native ESM, but if
      // the ESM parser also rejects it, surface the original CJS error.
      if (supportsSyncEvaluate && error instanceof CjsParseError) {
        try {
          return this.requireEsm<T>(modulePath);
        } catch (esmError) {
          if (esmError instanceof Error && esmError.name === 'SyntaxError') {
            throw error.cause;
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
    if (path.extname(modulePath) === '.json') {
      const transformed = this.transformCache.transformJson(
        modulePath,
        options,
      );
      localModule.exports = this.environment.global.JSON.parse(transformed);
    } else if (path.extname(modulePath) === '.node') {
      localModule.exports = require(modulePath);
    } else {
      // testState gates apply only to executing JS bodies - JSON/.node go
      // through pure data parsing and don't run user code in the VM.
      if (
        this.testState.bailIfTornDown(
          'You are trying to `require` a file after the Jest environment has been torn down.',
        )
      ) {
        return;
      }
      if (!runtimeSupportsVmModules) {
        this.testState.throwIfBetweenTests(
          'You are trying to `require` a file outside of the scope of the test code.',
        );
      }
      const fromPath = moduleName ? from : null;
      const result = this.executor.exec(
        localModule,
        options,
        moduleRegistry,
        fromPath,
        moduleName,
      );
      if (result === 'env-disposed') {
        this.logFormattedReferenceError(
          'You are trying to `require` a file after the Jest environment has been torn down.',
        );
        process.exitCode = 1;
        return;
      }
    }
    localModule.loaded = true;
  }
}
