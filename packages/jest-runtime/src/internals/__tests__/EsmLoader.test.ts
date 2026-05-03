/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {SourceTextModule, SyntheticModule, createContext} from 'node:vm';
import {testWithSyncEsm, testWithVmEsm} from '@jest/test-utils';
import type {JestEnvironment} from '@jest/environment';
import type {CjsExportsCache} from '../CjsExportsCache';
import {EsmLoader, type TestState} from '../EsmLoader';
import type {FileCache} from '../FileCache';
import type {MockState} from '../MockState';
import type {ModuleRegistries} from '../ModuleRegistries';
import type {Resolution} from '../Resolution';
import type {TransformCache} from '../TransformCache';
import type {CoreModuleProvider} from '../cjsRequire';

type Stubs = {
  resolution: jest.Mocked<Resolution>;
  fileCache: jest.Mocked<FileCache>;
  transformCache: jest.Mocked<TransformCache>;
  registries: jest.Mocked<ModuleRegistries>;
  mockState: jest.Mocked<MockState>;
  environment: JestEnvironment;
  cjsExportsCache: jest.Mocked<CjsExportsCache>;
  coreModule: jest.Mocked<CoreModuleProvider>;
  shouldLoadAsEsm: jest.MockedFunction<(modulePath: string) => boolean>;
  requireModuleOrMock: jest.MockedFunction<
    (from: string, moduleName: string) => unknown
  >;
  getJestObject: jest.MockedFunction<(from: string) => any>;
  getEnvironmentGlobals: jest.MockedFunction<() => any>;
  getTestState: jest.MockedFunction<() => TestState>;
  logFormattedReferenceError: jest.MockedFunction<(msg: string) => void>;
};

function makeLoader(overrides: Partial<Stubs> = {}) {
  const context = createContext({});
  const esmRegistry = new Map<string, unknown>();
  const stubs: Stubs = {
    cjsExportsCache: {
      getExportsOf: jest.fn(() => []),
    } as unknown as jest.Mocked<CjsExportsCache>,
    coreModule: {
      require: jest.fn(),
    } as unknown as jest.Mocked<CoreModuleProvider>,
    environment: {
      getVmContext: () => context,
    } as unknown as JestEnvironment,
    fileCache: {
      readFileBuffer: jest.fn(),
    } as unknown as jest.Mocked<FileCache>,
    getEnvironmentGlobals: jest.fn(() => ({})),
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
    requireModuleOrMock: jest.fn() as any,
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
    cjsExportsCache: stubs.cjsExportsCache,
    coreModule: stubs.coreModule,
    environment: stubs.environment,
    fileCache: stubs.fileCache,
    getEnvironmentGlobals: stubs.getEnvironmentGlobals,
    getJestObject: stubs.getJestObject,
    getTestState: stubs.getTestState,
    logFormattedReferenceError: stubs.logFormattedReferenceError,
    mockState: stubs.mockState,
    registries: stubs.registries,
    requireModuleOrMock: stubs.requireModuleOrMock,
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

  testWithSyncEsm(
    'returns cached fully-evaluated entry from registry',
    async () => {
      const {context, esmRegistry, loader} = makeLoader();
      const cached = new SyntheticModule(['x'], () => {}, {
        context,
        identifier: '/m.mjs',
      });
      // Settle to `'evaluated'` — that's the contract for cache reuse.
      await cached.link(() => {
        throw new Error('no deps');
      });
      await cached.evaluate();
      esmRegistry.set('/m.mjs', cached);
      const result = loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred');
      expect(result).toBe(cached);
    },
  );

  testWithSyncEsm(
    'bails when registry holds an unlinked module (legacy mid-flight stash)',
    () => {
      // Regression: `loadEsmModule`'s source-text branch does `registry.set`
      // before `link()` runs, leaving an `'unlinked'` SourceTextModule in the
      // registry. The sync graph used to treat any non-Promise registry entry
      // as a cache hit, then crash on `.namespace` access in
      // `requireEsmModule`. The fix is to gate cache reuse on settled status.
      const {context, esmRegistry, loader} = makeLoader();
      const stashed = new SourceTextModule('export const x = 1;', {
        context,
        identifier: '/m.mjs',
      });
      expect(stashed.status).toBe('unlinked');
      esmRegistry.set('/m.mjs', stashed);
      const result = loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred');
      expect(result).toBeNull();
    },
  );

  testWithSyncEsm(
    'rethrows the cached error when registry holds an errored module',
    async () => {
      const {context, esmRegistry, loader} = makeLoader();
      const errored = new SyntheticModule(
        ['x'],
        () => {
          throw new Error('boom from module body');
        },
        {context, identifier: '/m.mjs'},
      );
      await errored.link(() => {
        throw new Error('no deps');
      });
      // Drive to `'errored'` by forcing evaluate to fail.
      await errored.evaluate().catch(() => {});
      expect(errored.status).toBe('errored');
      esmRegistry.set('/m.mjs', errored);
      expect(() =>
        loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred'),
      ).toThrow('boom from module body');
    },
  );

  testWithSyncEsm(
    'rethrows when tryCommitSynthetic finds an errored entry (CJS-as-ESM)',
    async () => {
      // `resolveSpecifierForSyncGraph`'s CJS-as-ESM branch goes through
      // `tryCommitSynthetic`. If the registry holds a previously-errored
      // synthetic at that key, we should rethrow the original error rather
      // than bail with a misleading "concurrent import" ERR_REQUIRE_ESM.
      const {context, esmRegistry, loader, stubs} = makeLoader({
        shouldLoadAsEsm: jest.fn(() => false),
      });
      // Pre-stash an errored synth at the cjs-as-esm cache key.
      const errored = new SyntheticModule(
        ['x'],
        () => {
          throw new Error('cached cjs-as-esm error');
        },
        {context, identifier: '/dep.cjs'},
      );
      await errored.link(() => {
        throw new Error('no deps');
      });
      await errored.evaluate().catch(() => {});
      expect(errored.status).toBe('errored');
      esmRegistry.set('/dep.cjs', errored);

      stubs.transformCache.transform.mockReturnValue(
        "import {x} from './dep.cjs'; globalThis.__x = x;",
      );
      stubs.resolution.resolveEsm.mockReturnValue('/dep.cjs');

      expect(() =>
        loader.tryLoadGraphSync('/entry.mjs', '', 'sync-required'),
      ).toThrow('cached cjs-as-esm error');
    },
  );

  testWithSyncEsm(
    'rethrows when an existing module mock is errored (importMockSync)',
    async () => {
      const {context, esmRegistry, loader, stubs} = makeLoader({
        mockState: {
          getEsmFactory: jest.fn(() => undefined),
          getEsmModuleId: jest.fn(() => '/dep.mjs'),
          shouldMockEsmSync: jest.fn(() => true),
        } as unknown as jest.Mocked<MockState>,
      });
      const erroredMock = new SyntheticModule(
        ['x'],
        () => {
          throw new Error('mock evaluation failed');
        },
        {context, identifier: '/dep.mjs'},
      );
      await erroredMock.link(() => {
        throw new Error('no deps');
      });
      await erroredMock.evaluate().catch(() => {});
      expect(erroredMock.status).toBe('errored');
      // module-mock store, not the active registry
      stubs.registries.getModuleMock.mockReturnValue(erroredMock);
      stubs.transformCache.transform.mockReturnValue(
        "import './dep.mjs'; globalThis.__x = 1;",
      );
      // unused but keep the registry intentionally empty for clarity
      void esmRegistry;

      expect(() =>
        loader.tryLoadGraphSync('/entry.mjs', '', 'sync-required'),
      ).toThrow('mock evaluation failed');
    },
  );

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
    'routes core-module specifiers through coreModule.require',
    () => {
      const {loader, stubs} = makeLoader({
        resolution: {
          isCoreModule: jest.fn(() => true),
          resolveEsm: jest.fn(),
        } as unknown as jest.Mocked<Resolution>,
      });
      stubs.coreModule.require.mockReturnValue({foo: 'bar'});
      const result = loader.tryLoadGraphSync('fs', '', 'sync-preferred');
      expect(stubs.coreModule.require).toHaveBeenCalledWith('fs', true);
      expect(result?.namespace).toMatchObject({
        default: {foo: 'bar'},
        foo: 'bar',
      });
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
    'routes a CJS dep through requireModuleOrMock (extension-point bridge)',
    () => {
      // A CJS file imported from ESM: `shouldLoadAsEsm` returns false, so the
      // resolver delegates to `buildCjsAsEsmSyntheticModule` which calls back
      // through `requireModuleOrMock` (the override seam).
      const {context, loader, stubs} = makeLoader({
        shouldLoadAsEsm: jest.fn(() => false),
      });
      stubs.requireModuleOrMock.mockReturnValue({fromCjs: 'yes'});
      stubs.cjsExportsCache.getExportsOf.mockReturnValue(new Set(['fromCjs']));
      stubs.transformCache.transform.mockReturnValue(
        "import {fromCjs} from './dep.cjs'; globalThis.__cjsBridgeOk = fromCjs;",
      );
      stubs.resolution.resolveEsm.mockReturnValue('/dep.cjs');

      const result = loader.tryLoadGraphSync(
        '/entry.mjs',
        '',
        'sync-preferred',
      );
      expect(result).not.toBeNull();
      expect(stubs.requireModuleOrMock).toHaveBeenCalledWith(
        '/entry.mjs',
        '/dep.cjs',
      );
      expect((context as any).__cjsBridgeOk).toBe('yes');
    },
  );

  testWithSyncEsm(
    'routes `@jest/globals` through getEnvironmentGlobals + getJestObject',
    () => {
      const {context, loader, stubs} = makeLoader();
      stubs.getEnvironmentGlobals.mockReturnValue({describe: 'describe-stub'});
      stubs.getJestObject.mockReturnValue({kind: 'jest-stub'});
      stubs.transformCache.transform.mockReturnValue(
        "import {jest} from '@jest/globals'; globalThis.__jest = jest;",
      );

      loader.tryLoadGraphSync('/entry.mjs', '', 'sync-preferred');
      expect(stubs.getEnvironmentGlobals).toHaveBeenCalled();
      expect(stubs.getJestObject).toHaveBeenCalledWith('/entry.mjs');
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

describe('EsmLoader.dynamicImportFromCjs (legacy linkAndEvaluate)', () => {
  testWithVmEsm(
    'rethrows the original error when the resolved module is errored',
    async () => {
      // Regression: `linkAndEvaluateModule` used to fall through on
      // `'errored'` and return the module silently; the caller's downstream
      // `.namespace` access would then surface a less-helpful
      // `ERR_VM_MODULE_STATUS` instead of the original evaluation error.
      const {context, esmRegistry, loader} = makeLoader();
      const errored = new SyntheticModule(
        ['x'],
        () => {
          throw new Error('original eval error');
        },
        {context, identifier: '@jest/globals/from.mjs'},
      );
      await errored.link(() => {
        throw new Error('no deps');
      });
      await errored.evaluate().catch(() => {});
      expect(errored.status).toBe('errored');

      // `resolveModule`'s `@jest/globals` branch returns this directly from the
      // registry, so `dynamicImportFromCjs` ends up calling
      // `linkAndEvaluateModule(errored)` — exactly the path the new guard
      // protects.
      esmRegistry.set('@jest/globals/from.mjs', errored);

      await expect(
        loader.dynamicImportFromCjs('@jest/globals', 'from.mjs', context),
      ).rejects.toThrow('original eval error');
    },
  );
});
