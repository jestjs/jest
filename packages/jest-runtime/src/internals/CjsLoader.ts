/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import type {JestEnvironment, Module} from '@jest/environment';
import {isError} from 'jest-util';
import type {MockState} from './MockState';
import {CjsParseError, type ModuleExecutor} from './ModuleExecutor';
import type {ModuleRegistries} from './ModuleRegistries';
import type {Resolution} from './Resolution';
import type {TestState} from './TestState';
import type {TransformCache, TransformOptions} from './TransformCache';
import type {CoreModuleProvider} from './cjsRequire';
import {hasEsmSyntax} from './esmLexer';
import {
  type InitialModule,
  type ModuleRegistry,
  createInitialModule,
} from './moduleTypes';
import {
  runtimeSupportsVmModules,
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
  requireEsm: <T>(modulePath: string, requiredFrom: string) => T;
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
  private readonly requireEsm: <T>(
    modulePath: string,
    requiredFrom: string,
  ) => T;
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
    if (moduleName && this.resolution.isCoreModule(moduleName)) {
      return this.coreModule.require(moduleName) as T;
    }

    const isInternal = options?.isInternalModule ?? false;
    let modulePath: string | undefined;

    // Some old tests rely on this mocking behavior. Ideally we'll change this
    // to be more explicit.
    if (
      moduleName &&
      !isInternal &&
      !isRequireActual &&
      !this.resolution.getModule(moduleName)
    ) {
      const manualMock = this.resolution.getCjsMockModule(from, moduleName);
      if (
        manualMock &&
        manualMock !== this.executor.getCurrentlyExecutingManualMock() &&
        !this.mockState.isExplicitlyUnmocked(
          this.mockState.getCjsModuleId(from, moduleName),
        )
      ) {
        modulePath = manualMock;
      }
    }

    if (!modulePath) {
      modulePath = this.resolution.resolveCjs(from, moduleName);
    }

    // On Node 24.9+ we can require() ESM natively. On older Node, fall
    // through to the CJS path so a configured transform can convert it.
    if (supportsSyncEvaluate && this.resolution.shouldLoadAsEsm(modulePath)) {
      const exports = this.requireEsm<T>(modulePath, from);
      if (!isInternal) {
        this.recordEsmChildModule(from, modulePath);
      }
      return exports;
    }

    const moduleRegistry = isInternal
      ? this.registries.getInternalCjsRegistry()
      : this.registries.getActiveCjsRegistry();

    const module = moduleRegistry.get(modulePath);
    if (module) {
      if (!isInternal) {
        this.recordChildModule(from, module as Module, moduleRegistry);
      }
      return (module as Module).exports;
    }

    // We must register the pre-allocated module object first so that any
    // circular dependencies that may arise while evaluating the module can
    // be satisfied.
    const localModule = createInitialModule(modulePath);
    moduleRegistry.set(modulePath, localModule);
    if (!isInternal) {
      this.recordChildModule(from, localModule as Module, moduleRegistry);
    }

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
      this.removeChildModule(from, localModule as Module, moduleRegistry);
      if (error instanceof CjsParseError) {
        return this.handleCjsParseError(modulePath, from, error);
      }
      // Without --experimental-vm-modules, CjsParseError is never thrown.
      // Detect untransformed ESM syntax and surface an actionable error.
      if (
        !supportsSyncEvaluate &&
        isError(error) &&
        error.name === 'SyntaxError' &&
        hasEsmSyntax(this.transformCache.getCachedSource(modulePath) ?? '') &&
        !this.resolution.isExplicitlyCommonjs(modulePath)
      ) {
        throw createRequireEsmError(modulePath);
      }
      throw error;
    }

    return localModule.exports;
  }

  // Runs after evaluation, unlike Node, which registers the child before the
  // ESM body executes: the wrapper's `exports` is the require() result,
  // which exists only once the module is `evaluated` - registering earlier
  // would break the evaluated-only invariant the require.cache surface
  // relies on. The end state matches Node either way (present on success,
  // absent on failure), and a require() cycle back into the parent throws
  // ERR_REQUIRE_CYCLE_MODULE before it could observe the difference.
  //
  // The parent lookup targets the active CJS registry, so an internal
  // requiring module (registered elsewhere) never gains children.
  private recordEsmChildModule(from: string, modulePath: string): void {
    const wrapper = this.registries.getEsmRequireCacheEntry(modulePath);
    if (wrapper) {
      this.recordChildModule(
        from,
        wrapper as Module,
        this.registries.getActiveCjsRegistry(),
      );
    }
  }

  // Node records every loaded module on its requiring parent - fresh loads
  // before evaluation and registry hits alike, deduplicated. A load that
  // throws is removed again.
  private recordChildModule(
    from: string,
    child: Module,
    moduleRegistry: ModuleRegistry,
  ): void {
    const parent = moduleRegistry.get(from);
    if (!parent || !('children' in parent) || parent.children.includes(child)) {
      return;
    }
    parent.children.push(child);
  }

  private removeChildModule(
    from: string,
    child: Module,
    moduleRegistry: ModuleRegistry,
  ): void {
    const parent = moduleRegistry.get(from);
    if (!parent || !('children' in parent)) {
      return;
    }
    const index = parent.children.indexOf(child);
    if (index !== -1) {
      parent.children.splice(index, 1);
    }
  }

  /**
   * The CJS compiler rejected the file (ESM syntax in a non-ESM context).
   * On Node 24.9+ retry as native ESM; on older Node either surface an
   * actionable error (for explicitly ESM-marked files) or re-throw so the
   * ESM loader's own CjsParseError catch can trigger its fallback path.
   */
  private handleCjsParseError<T>(
    modulePath: string,
    from: string,
    parseError: CjsParseError,
  ): T {
    // A package that declares `"type": "commonjs"` opted out of ESM for its
    // `.js` files - Node throws the parse error instead of retrying.
    if (this.resolution.isExplicitlyCommonjs(modulePath)) {
      throw parseError.cause;
    }
    if (supportsSyncEvaluate) {
      let exports: T;
      try {
        exports = this.requireEsm<T>(modulePath, from);
      } catch (esmError) {
        // Both CJS and ESM parsers rejected it — surface the original CJS error.
        if (esmError instanceof Error && esmError.name === 'SyntaxError') {
          throw parseError.cause;
        }
        throw esmError;
      }
      this.recordEsmChildModule(from, modulePath);
      return exports;
    }
    // Explicitly ESM-marked files (.mjs / "type":"module") can't be retried
    // by the ESM loader — give the user an actionable error.
    if (this.resolution.shouldLoadAsEsm(modulePath)) {
      throw createRequireEsmError(modulePath);
    }
    // Unmarked file with ESM syntax — re-throw so the ESM loader can retry.
    throw parseError;
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

function createRequireEsmError(modulePath: string): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new Error(
    `Must use import to load ES Module: ${modulePath}\n\n` +
      'The file contains ESM syntax (import/export) that could not be ' +
      'executed as CommonJS. Either:\n' +
      '  - Configure a transform (e.g. babel-jest) that compiles this ' +
      'file to CommonJS (see https://jestjs.io/docs/code-transformation)\n' +
      '  - If the file is in "node_modules", allow it to be transformed by ' +
      'adjusting "transformIgnorePatterns" (see ' +
      'https://jestjs.io/docs/configuration#transformignorepatterns-arraystring)\n' +
      '  - Use Node v24.9+ where Jest supports require(esm) natively ' +
      '(see https://jestjs.io/docs/ecmascript-modules#require-of-esm)',
  );
  error.code = 'ERR_REQUIRE_ESM';
  return error;
}
