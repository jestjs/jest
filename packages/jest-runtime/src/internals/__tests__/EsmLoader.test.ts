/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {SyntheticModule, createContext} from 'node:vm';
import {testWithSyncEsm} from '@jest/test-utils';
import type {JestEnvironment} from '@jest/environment';
import {EsmLoader, type TestState} from '../EsmLoader';
import type {FileCache} from '../FileCache';
import type {MockState} from '../MockState';
import type {ModuleRegistries} from '../ModuleRegistries';
import type {Resolution} from '../Resolution';
import type {TransformCache} from '../TransformCache';

type Stubs = {
  resolution: jest.Mocked<Resolution>;
  fileCache: jest.Mocked<FileCache>;
  transformCache: jest.Mocked<TransformCache>;
  registries: jest.Mocked<ModuleRegistries>;
  mockState: jest.Mocked<MockState>;
  environment: JestEnvironment;
  shouldLoadAsEsm: jest.MockedFunction<(modulePath: string) => boolean>;
  buildCoreSyntheticModule: jest.MockedFunction<
    (name: string, ctx: any) => SyntheticModule
  >;
  buildJestGlobalsSyntheticModule: jest.MockedFunction<
    (from: string, ctx: any) => SyntheticModule
  >;
  buildCjsAsEsmSyntheticModule: jest.MockedFunction<
    (from: string, modulePath: string, ctx: any) => SyntheticModule
  >;
  esmDynamicImport: jest.MockedFunction<
    (specifier: string, referencingModule: any) => Promise<any>
  >;
  getJestObject: jest.MockedFunction<(from: string) => any>;
  getTestState: jest.MockedFunction<() => TestState>;
  logFormattedReferenceError: jest.MockedFunction<(msg: string) => void>;
};

function makeLoader(overrides: Partial<Stubs> = {}) {
  const context = createContext({});
  const esmRegistry = new Map<string, unknown>();
  const stubs: Stubs = {
    buildCjsAsEsmSyntheticModule: jest.fn(),
    buildCoreSyntheticModule: jest.fn(),
    buildJestGlobalsSyntheticModule: jest.fn(),
    environment: {
      getVmContext: () => context,
    } as unknown as JestEnvironment,
    esmDynamicImport: jest.fn() as any,
    fileCache: {
      readFileBuffer: jest.fn(),
    } as unknown as jest.Mocked<FileCache>,
    getJestObject: jest.fn() as any,
    getTestState: jest.fn(() => 'inTest' as const),
    logFormattedReferenceError: jest.fn(),
    mockState: {
      getEsmFactory: jest.fn(() => undefined),
      getEsmModuleId: jest.fn((from, name) => `${from}\0${name}`),
      shouldMockEsmSync: jest.fn(() => false),
    } as unknown as jest.Mocked<MockState>,
    registries: {
      getActiveEsmRegistry: jest.fn(() => esmRegistry),
      getModuleMock: jest.fn(),
      setModuleMock: jest.fn(),
    } as unknown as jest.Mocked<ModuleRegistries>,
    resolution: {
      isCoreModule: jest.fn(() => false),
      resolveEsm: jest.fn((_from, name) => name),
    } as unknown as jest.Mocked<Resolution>,
    shouldLoadAsEsm: jest.fn(() => true),
    transformCache: {
      canTransformSync: jest.fn(() => true),
      hasMutex: jest.fn(() => false),
      transform: jest.fn(),
    } as unknown as jest.Mocked<TransformCache>,
    ...overrides,
  };
  const loader = new EsmLoader({
    buildCjsAsEsmSyntheticModule: stubs.buildCjsAsEsmSyntheticModule,
    buildCoreSyntheticModule: stubs.buildCoreSyntheticModule,
    buildJestGlobalsSyntheticModule: stubs.buildJestGlobalsSyntheticModule,
    environment: stubs.environment,
    esmDynamicImport: stubs.esmDynamicImport,
    fileCache: stubs.fileCache,
    getJestObject: stubs.getJestObject,
    getTestState: stubs.getTestState,
    logFormattedReferenceError: stubs.logFormattedReferenceError,
    mockState: stubs.mockState,
    registries: stubs.registries,
    resolution: stubs.resolution,
    shouldLoadAsEsm: stubs.shouldLoadAsEsm,
    transformCache: stubs.transformCache,
  });
  return {context, esmRegistry, loader, stubs};
}

describe('EsmLoader.tryLoadGraphSync', () => {
  testWithSyncEsm('returns null and logs when test state is tornDown', () => {
    const {loader, stubs} = makeLoader({
      getTestState: jest.fn(() => 'tornDown' as const),
    });
    const result = loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred');
    expect(result).toBeNull();
    expect(stubs.logFormattedReferenceError).toHaveBeenCalledWith(
      expect.stringContaining('torn down'),
    );
  });

  testWithSyncEsm('returns cached non-Promise entry from registry', () => {
    const {context, esmRegistry, loader} = makeLoader();
    const cached = new SyntheticModule(['x'], () => {}, {
      context,
      identifier: '/m.mjs',
    });
    esmRegistry.set('/m.mjs', cached);
    const result = loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred');
    expect(result).toBe(cached);
  });

  testWithSyncEsm(
    'returns null when registry has a mid-flight Promise (legacy async load)',
    () => {
      const {esmRegistry, loader} = makeLoader();
      esmRegistry.set('/m.mjs', Promise.resolve());
      const result = loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred');
      expect(result).toBeNull();
    },
  );

  testWithSyncEsm(
    'returns null when transformCache holds a mutex on the root',
    () => {
      const {loader, stubs} = makeLoader({
        transformCache: {
          canTransformSync: jest.fn(() => true),
          hasMutex: jest.fn(() => true),
          transform: jest.fn(),
        } as unknown as jest.Mocked<TransformCache>,
      });
      const result = loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred');
      expect(result).toBeNull();
      expect(stubs.transformCache.hasMutex).toHaveBeenCalledWith('/m.mjs');
    },
  );

  testWithSyncEsm(
    'routes core-module specifiers through buildCoreSyntheticModule',
    () => {
      const {context, loader, stubs} = makeLoader({
        resolution: {
          isCoreModule: jest.fn(() => true),
          resolveEsm: jest.fn(),
        } as unknown as jest.Mocked<Resolution>,
      });
      stubs.buildCoreSyntheticModule.mockImplementation(
        (name, ctx) =>
          new SyntheticModule(
            ['default'],
            function () {
              this.setExport('default', {core: name});
            },
            {context: ctx, identifier: name},
          ),
      );
      const result = loader.tryLoadGraphSync('fs', '', 'sync-preferred');
      expect(stubs.buildCoreSyntheticModule).toHaveBeenCalledWith(
        'fs',
        context,
      );
      expect(result?.namespace).toMatchObject({default: {core: 'fs'}});
    },
  );

  testWithSyncEsm(
    'sync-required mode rejects async transformers with ERR_REQUIRE_ASYNC_MODULE',
    () => {
      const {loader} = makeLoader({
        transformCache: {
          canTransformSync: jest.fn(() => false),
          hasMutex: jest.fn(() => false),
          transform: jest.fn(),
        } as unknown as jest.Mocked<TransformCache>,
      });
      expect(() =>
        loader.tryLoadGraphSync('/m.mjs', '', 'sync-required'),
      ).toThrow(
        expect.objectContaining({
          code: 'ERR_REQUIRE_ASYNC_MODULE',
          message: expect.stringContaining('async-only'),
        }),
      );
    },
  );

  testWithSyncEsm(
    'sync-preferred mode bails (returns null) on async-only transformer',
    () => {
      const {loader} = makeLoader({
        transformCache: {
          canTransformSync: jest.fn(() => false),
          hasMutex: jest.fn(() => false),
          transform: jest.fn(),
        } as unknown as jest.Mocked<TransformCache>,
      });
      const result = loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred');
      expect(result).toBeNull();
    },
  );
});

describe('EsmLoader bridges', () => {
  testWithSyncEsm(
    'routes a CJS dep to buildCjsAsEsmSyntheticModule callback (extension-point bridge)',
    () => {
      // A CJS file imported from ESM: `shouldLoadAsEsm` returns false, so
      // the resolver delegates to the Runtime-owned wrapper (which embeds the
      // `requireModuleOrMock` override seam). We assert the callback fires.
      const {context, loader, stubs} = makeLoader({
        shouldLoadAsEsm: jest.fn(() => false),
      });
      const stExports = {fromCjs: 'yes'};
      stubs.buildCjsAsEsmSyntheticModule.mockImplementation(
        (_from, _modulePath, ctx) =>
          new SyntheticModule(
            ['fromCjs'],
            function () {
              this.setExport('fromCjs', 'yes');
            },
            {context: ctx, identifier: 'cjs-as-esm'},
          ),
      );
      stubs.transformCache.transform.mockReturnValue(
        "import {fromCjs} from './dep.cjs'; globalThis.__cjsBridgeOk = fromCjs;",
      );
      // The `dep.cjs` resolver returns the file path; `shouldLoadAsEsm(false)`
      // diverts it through the synthetic-module bridge.
      stubs.resolution.resolveEsm.mockReturnValue('/dep.cjs');

      const result = loader.tryLoadGraphSync(
        '/entry.mjs',
        '',
        'sync-preferred',
      );
      expect(result).not.toBeNull();
      expect(stubs.buildCjsAsEsmSyntheticModule).toHaveBeenCalledWith(
        '/entry.mjs',
        '/dep.cjs',
        context,
      );
      expect((context as any).__cjsBridgeOk).toBe(stExports.fromCjs);
    },
  );

  testWithSyncEsm(
    'routes `@jest/globals` to buildJestGlobalsSyntheticModule callback',
    () => {
      const {context, loader, stubs} = makeLoader();
      stubs.buildJestGlobalsSyntheticModule.mockImplementation(
        (_from, ctx) =>
          new SyntheticModule(
            ['jest'],
            function () {
              this.setExport('jest', {kind: 'jest-stub'});
            },
            {context: ctx, identifier: '@jest/globals'},
          ),
      );
      stubs.transformCache.transform.mockReturnValue(
        "import {jest} from '@jest/globals'; globalThis.__jest = jest;",
      );

      loader.tryLoadGraphSync('/entry.mjs', '', 'sync-preferred');
      expect(stubs.buildJestGlobalsSyntheticModule).toHaveBeenCalledWith(
        '/entry.mjs',
        context,
      );
      expect((context as any).__jest).toEqual({kind: 'jest-stub'});
    },
  );
});

describe('EsmLoader mock dispatch', () => {
  testWithSyncEsm(
    'sync-required mode rejects async mock factory with ERR_REQUIRE_ASYNC_MODULE',
    () => {
      const {loader, stubs} = makeLoader({
        mockState: {
          getEsmFactory: jest.fn(() => () => Promise.resolve({})),
          getEsmModuleId: jest.fn(() => 'mid'),
          shouldMockEsmSync: jest.fn(() => true),
        } as unknown as jest.Mocked<MockState>,
      });
      stubs.transformCache.transform.mockReturnValue(
        "import './dep.mjs'; globalThis.__loaded = true;",
      );
      stubs.resolution.resolveEsm.mockReturnValue('/dep.mjs');

      expect(() =>
        loader.tryLoadGraphSync('/entry.mjs', '', 'sync-required'),
      ).toThrow(expect.objectContaining({code: 'ERR_REQUIRE_ASYNC_MODULE'}));
    },
  );

  testWithSyncEsm(
    'sync-preferred mode bails on async mock factory (returns null)',
    () => {
      const {loader, stubs} = makeLoader({
        mockState: {
          getEsmFactory: jest.fn(() => () => Promise.resolve({})),
          getEsmModuleId: jest.fn(() => 'mid'),
          shouldMockEsmSync: jest.fn(() => true),
        } as unknown as jest.Mocked<MockState>,
      });
      stubs.transformCache.transform.mockReturnValue(
        "import './dep.mjs'; globalThis.__loaded = true;",
      );
      stubs.resolution.resolveEsm.mockReturnValue('/dep.mjs');

      const result = loader.tryLoadGraphSync(
        '/entry.mjs',
        '',
        'sync-preferred',
      );
      expect(result).toBeNull();
    },
  );

  testWithSyncEsm(
    'sync mock factory short-circuits the dep with the factory result',
    () => {
      const factory = jest.fn(() => ({mocked: 'value'}));
      const {context, loader, stubs} = makeLoader({
        mockState: {
          getEsmFactory: jest.fn(() => factory),
          getEsmModuleId: jest.fn(() => 'mid'),
          shouldMockEsmSync: jest.fn(() => true),
        } as unknown as jest.Mocked<MockState>,
      });
      stubs.transformCache.transform.mockReturnValue(
        "import {mocked} from './dep.mjs'; globalThis.__mocked = mocked;",
      );
      stubs.resolution.resolveEsm.mockReturnValue('/dep.mjs');

      const result = loader.tryLoadGraphSync(
        '/entry.mjs',
        '',
        'sync-preferred',
      );
      expect(result).not.toBeNull();
      expect(factory).toHaveBeenCalled();
      expect((context as any).__mocked).toBe('value');
    },
  );
});

describe('EsmLoader.requireEsmModule', () => {
  testWithSyncEsm(
    'returns the module namespace on a successful sync load',
    async () => {
      const {context, esmRegistry, loader} = makeLoader();
      const synth = new SyntheticModule(
        ['answer'],
        function () {
          this.setExport('answer', 42);
        },
        {context, identifier: '/m.mjs'},
      );
      // Drive the synthetic to `'evaluated'` so its namespace is observable;
      // pre-evaluated registry entries are the contract for cached lookups.
      await synth.link(() => {
        throw new Error('no deps');
      });
      await synth.evaluate();
      esmRegistry.set('/m.mjs', synth);
      const ns = loader.requireEsmModule<{answer: number}>('/m.mjs');
      expect(ns.answer).toBe(42);
    },
  );

  testWithSyncEsm(
    'throws ERR_REQUIRE_ESM when the registry has a mid-flight Promise',
    () => {
      const {esmRegistry, loader} = makeLoader();
      esmRegistry.set('/m.mjs', Promise.resolve());
      expect(() => loader.requireEsmModule('/m.mjs')).toThrow(
        expect.objectContaining({
          code: 'ERR_REQUIRE_ESM',
          message: expect.stringContaining('concurrent'),
        }),
      );
    },
  );
});
