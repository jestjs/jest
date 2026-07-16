/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {testWithSyncEsm} from '@jest/test-utils';
import type {JestEnvironment} from '@jest/environment';
import {CjsLoader} from '../CjsLoader';
import type {CoreModuleProvider} from '../cjsRequire';
import type {ModuleExecutor} from '../ModuleExecutor';
import type {MockState} from '../MockState';
import type {ModuleRegistries} from '../ModuleRegistries';
import type {Resolution} from '../Resolution';
import {TestState} from '../TestState';
import type {TransformCache} from '../TransformCache';

type Stubs = {
  resolution: jest.Mocked<Resolution>;
  registries: jest.Mocked<ModuleRegistries>;
  mockState: jest.Mocked<MockState>;
  transformCache: jest.Mocked<TransformCache>;
  environment: JestEnvironment;
  coreModule: jest.Mocked<CoreModuleProvider>;
  executor: jest.Mocked<ModuleExecutor>;
  requireEsm: jest.MockedFunction<<T>(modulePath: string) => T>;
  testState: TestState;
  logFormattedReferenceError: jest.MockedFunction<(msg: string) => void>;
};

function makeLoader(overrides: Partial<Stubs> = {}) {
  const logFormattedReferenceError = jest.fn();
  const stubs: Stubs = {
    coreModule: {
      require: jest.fn(),
    } as unknown as jest.Mocked<CoreModuleProvider>,
    environment: {
      global: {JSON} as unknown as JestEnvironment['global'],
    } as JestEnvironment,
    executor: {
      exec: jest.fn(() => 'loaded' as const),
      getCurrentlyExecutingManualMock: jest.fn(() => null),
      mainModule: null,
      resetMainModule: jest.fn(),
    } as unknown as jest.Mocked<ModuleExecutor>,
    logFormattedReferenceError,
    mockState: {
      getCjsModuleId: jest.fn(() => 'id'),
      isExplicitlyUnmocked: jest.fn(() => false),
    } as unknown as jest.Mocked<MockState>,
    registries: {
      getActiveCjsRegistry: jest.fn(() => new Map()),
      getActiveEsmRegistry: jest.fn(() => new Map()),
    } as unknown as jest.Mocked<ModuleRegistries>,
    requireEsm: jest.fn() as any,
    resolution: {
      getCjsMockModule: jest.fn(() => null),
      getModule: jest.fn(() => null),
      isCoreModule: jest.fn(() => false),
      resolveCjs: jest.fn(() => '/m.js'),
      shouldLoadAsEsm: jest.fn(() => false),
    } as unknown as jest.Mocked<Resolution>,
    testState: new TestState(logFormattedReferenceError),
    transformCache: {
      transformJson: jest.fn((_path, _opts) => '{"answer":42}'),
    } as unknown as jest.Mocked<TransformCache>,
    ...overrides,
  };
  const loader = new CjsLoader({
    coreModule: stubs.coreModule,
    environment: stubs.environment,
    executor: stubs.executor,
    logFormattedReferenceError: stubs.logFormattedReferenceError,
    mockState: stubs.mockState,
    registries: stubs.registries,
    requireEsm: stubs.requireEsm,
    resolution: stubs.resolution,
    testState: stubs.testState,
    transformCache: stubs.transformCache,
  });
  return {loader, stubs};
}

describe('CjsLoader.requireModule', () => {
  test('routes core modules to coreModule.require', () => {
    const {loader, stubs} = makeLoader({
      coreModule: {
        require: jest.fn(() => 'fs-shim'),
      } as unknown as jest.Mocked<CoreModuleProvider>,
      resolution: {
        getCjsMockModule: jest.fn(() => null),
        getModule: jest.fn(() => null),
        isCoreModule: jest.fn(() => true),
      } as unknown as jest.Mocked<Resolution>,
    });
    expect(loader.requireModule('/from.js', 'fs')).toBe('fs-shim');
    expect(stubs.coreModule.require).toHaveBeenCalledWith(
      'fs',
      expect.any(Boolean),
    );
  });

  test('returns cached CJS module without re-executing', () => {
    const cachedExports = {cached: true};
    const cjsRegistry = new Map<string, unknown>([
      ['/m.js', {exports: cachedExports}],
    ]);
    const {loader, stubs} = makeLoader({
      registries: {
        getActiveCjsRegistry: jest.fn(() => cjsRegistry),
        getActiveEsmRegistry: jest.fn(() => new Map()),
      } as unknown as jest.Mocked<ModuleRegistries>,
    });
    const result = loader.requireModule('/from.js', './m.js');
    expect(result).toBe(cachedExports);
    expect(stubs.executor.exec).not.toHaveBeenCalled();
  });

  test('uses manual mock path when not currently executing it', () => {
    const cjsRegistry = new Map<string, unknown>();
    const {loader, stubs} = makeLoader({
      executor: {
        exec: jest.fn(() => 'loaded' as const),
        getCurrentlyExecutingManualMock: jest.fn(() => null),
        mainModule: null,
      } as unknown as jest.Mocked<ModuleExecutor>,
      registries: {
        getActiveCjsRegistry: jest.fn(() => cjsRegistry),
        getActiveEsmRegistry: jest.fn(() => new Map()),
      } as unknown as jest.Mocked<ModuleRegistries>,
      resolution: {
        getCjsMockModule: jest.fn(() => '/manual-mock.js'),
        getGlobalPaths: jest.fn(() => []),
        getModule: jest.fn(() => null),
        getModulePaths: jest.fn(() => []),
        isCoreModule: jest.fn(() => false),
        resolveCjs: jest.fn(),
        shouldLoadAsEsm: jest.fn(() => false),
      } as unknown as jest.Mocked<Resolution>,
    });
    loader.requireModule('/from.js', 'mock-target');
    expect(stubs.executor.exec).toHaveBeenCalledWith(
      expect.objectContaining({filename: '/manual-mock.js'}),
      undefined,
      cjsRegistry,
      '/from.js',
      'mock-target',
    );
  });

  test('skips manual mock when currently executing it (recursion guard)', () => {
    const {loader, stubs} = makeLoader({
      executor: {
        exec: jest.fn(() => 'loaded' as const),
        getCurrentlyExecutingManualMock: jest.fn(() => '/manual-mock.js'),
        mainModule: null,
      } as unknown as jest.Mocked<ModuleExecutor>,
      resolution: {
        getCjsMockModule: jest.fn(() => '/manual-mock.js'),
        getGlobalPaths: jest.fn(() => []),
        getModule: jest.fn(() => null),
        getModulePaths: jest.fn(() => []),
        isCoreModule: jest.fn(() => false),
        resolveCjs: jest.fn(() => '/real.js'),
        shouldLoadAsEsm: jest.fn(() => false),
      } as unknown as jest.Mocked<Resolution>,
    });
    loader.requireModule('/from.js', 'mock-target');
    // Should resolve and exec the REAL module, not the manual mock.
    expect(stubs.executor.exec).toHaveBeenCalledWith(
      expect.objectContaining({filename: '/real.js'}),
      undefined,
      expect.any(Map),
      '/from.js',
      'mock-target',
    );
  });

  testWithSyncEsm('routes ESM specifiers to requireEsm', () => {
    const {loader, stubs} = makeLoader({
      registries: {
        getActiveCjsRegistry: jest.fn(() => new Map()),
        getActiveEsmRegistry: jest.fn(() => new Map()),
      } as unknown as jest.Mocked<ModuleRegistries>,
      resolution: {
        getCjsMockModule: jest.fn(() => null),
        getModule: jest.fn(() => null),
        isCoreModule: jest.fn(() => false),
        resolveCjs: jest.fn(() => '/m.mjs'),
        shouldLoadAsEsm: jest.fn(() => true),
      } as unknown as jest.Mocked<Resolution>,
    });

    stubs.requireEsm.mockReturnValue('esm-result' as any);
    expect(loader.requireModule('/from.js', './m.mjs')).toBe('esm-result');
    expect(stubs.requireEsm).toHaveBeenCalledWith('/m.mjs');
  });
});

describe('CjsLoader.loadModule', () => {
  test('JSON files are parsed via transformCache.transformJson', () => {
    const {loader, stubs} = makeLoader();
    const localModule = {
      children: [],
      exports: {},
      filename: '/m.json',
      id: '/m.json',
      isPreloading: false,
      loaded: false,
      path: '/',
    };
    loader.loadModule(
      localModule,
      '/from.js',
      'm',
      '/m.json',
      undefined,
      new Map(),
    );
    expect(stubs.transformCache.transformJson).toHaveBeenCalledWith(
      '/m.json',
      undefined,
    );
    expect(localModule.exports).toEqual({answer: 42});
    expect(localModule.loaded).toBe(true);
    // Executor untouched for JSON.
    expect(stubs.executor.exec).not.toHaveBeenCalled();
  });

  test('JS files dispatch to executor.exec', () => {
    const {loader, stubs} = makeLoader();
    const localModule = {
      children: [],
      exports: {},
      filename: '/m.js',
      id: '/m.js',
      isPreloading: false,
      loaded: false,
      path: '/',
    };
    loader.loadModule(
      localModule,
      '/from.js',
      'm',
      '/m.js',
      undefined,
      new Map(),
    );
    expect(stubs.executor.exec).toHaveBeenCalled();
    expect(localModule.loaded).toBe(true);
  });

  test('logs and bails when env was disposed mid-exec', () => {
    const {loader, stubs} = makeLoader({
      executor: {
        exec: jest.fn(() => 'env-disposed' as const),
        getCurrentlyExecutingManualMock: jest.fn(() => null),
        mainModule: null,
      } as unknown as jest.Mocked<ModuleExecutor>,
    });
    const localModule = {
      children: [],
      exports: {},
      filename: '/m.js',
      id: '/m.js',
      isPreloading: false,
      loaded: false,
      path: '/',
    };
    loader.loadModule(
      localModule,
      '/from.js',
      'm',
      '/m.js',
      undefined,
      new Map(),
    );
    expect(stubs.logFormattedReferenceError).toHaveBeenCalledWith(
      expect.stringContaining('after the Jest environment has been torn down'),
    );
    expect(localModule.loaded).toBe(false);
  });

  test('bails when testState reports torn down (JS branch only)', () => {
    const {loader, stubs} = makeLoader();
    stubs.testState.teardown();
    const localModule = {
      children: [],
      exports: {},
      filename: '/m.js',
      id: '/m.js',
      isPreloading: false,
      loaded: false,
      path: '/',
    };
    loader.loadModule(
      localModule,
      '/from.js',
      'm',
      '/m.js',
      undefined,
      new Map(),
    );
    expect(stubs.logFormattedReferenceError).toHaveBeenCalledWith(
      expect.stringContaining('after the Jest environment has been torn down'),
    );
    expect(stubs.executor.exec).not.toHaveBeenCalled();
  });
});
