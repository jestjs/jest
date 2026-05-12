/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {SourceTextModule, SyntheticModule, createContext} from 'node:vm';
import {
  testWithLinkedSyntheticModule,
  testWithSyncEsm,
  testWithVmEsm,
} from '@jest/test-utils';
import type {JestEnvironment} from '@jest/environment';
import {invariant} from 'jest-util';
import type {CjsExportsCache} from '../CjsExportsCache';
import {EsmLoader, LOAD_ASYNC, validateImportAttributes} from '../EsmLoader';
import {CjsParseError} from '../ModuleExecutor';
import type {FileCache} from '../FileCache';
import type {JestGlobals} from '../JestGlobals';
import type {MockState} from '../MockState';
import type {ModuleRegistries} from '../ModuleRegistries';
import type {Resolution} from '../Resolution';
import {TestState} from '../TestState';
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
  jestGlobals: jest.Mocked<JestGlobals>;
  shouldLoadAsEsm: jest.MockedFunction<(modulePath: string) => boolean>;
  requireModuleOrMock: jest.MockedFunction<
    (from: string, moduleName: string) => unknown
  >;
  testState: TestState;
  logFormattedReferenceError: jest.MockedFunction<(msg: string) => void>;
};

function makeLoader(overrides: Partial<Stubs> = {}) {
  const context = createContext({});
  const esmRegistry = new Map<string, unknown>();
  const logFormattedReferenceError = jest.fn();
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
    jestGlobals: {
      esmGlobalsModule: jest.fn(),
      jestObjectFor: jest.fn(),
    } as unknown as jest.Mocked<JestGlobals>,
    logFormattedReferenceError,
    mockState: {
      getEsmFactory: jest.fn(() => undefined),
      getEsmModuleId: jest.fn((from, name) => `${from}\0${name}`),
      shouldMockEsmSync: jest.fn((_from, name) => ({
        moduleID: name,
        shouldMock: false,
      })),
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
    testState: new TestState(logFormattedReferenceError),
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
    jestGlobals: stubs.jestGlobals,
    mockState: stubs.mockState,
    registries: stubs.registries,
    requireModuleOrMock: stubs.requireModuleOrMock,
    resolution: stubs.resolution,
    shouldLoadAsEsm: stubs.shouldLoadAsEsm,
    testState: stubs.testState,
    transformCache: stubs.transformCache,
  });
  return {context, esmRegistry, loader, stubs};
}

describe('EsmLoader.tryLoadGraphSync', () => {
  test('throws when testState reports torn down', () => {
    const {loader, stubs} = makeLoader();
    stubs.testState.teardown();
    expect(() =>
      loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred'),
    ).toThrow('torn down');
    expect(stubs.logFormattedReferenceError).toHaveBeenCalledWith(
      expect.stringContaining('torn down'),
    );
  });

  testWithVmEsm(
    'returns cached fully-evaluated entry from registry',
    async () => {
      const {context, esmRegistry, loader} = makeLoader();
      const cached = new SyntheticModule(['x'], () => {}, {
        context,
        identifier: '/m.mjs',
      });
      // Settle to `'evaluated'` - that's the contract for cache reuse.
      await cached.link(() => {
        throw new Error('no deps');
      });
      await cached.evaluate();
      esmRegistry.set('/m.mjs', cached);
      const result = loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred');
      expect(result).toBe(cached);
    },
  );

  testWithVmEsm(
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
      expect(result).toBe(LOAD_ASYNC);
    },
  );

  testWithVmEsm(
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

  testWithLinkedSyntheticModule(
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
    'falls through to native ESM when a CJS dep throws CjsParseError',
    () => {
      // When a .cjs file has ESM syntax, `buildCjsAsEsmSyntheticModule` throws
      // `CjsParseError`. `resolveSpecifierForSyncGraph` catches it and falls
      // through to the native ESM enqueue path rather than crashing the graph.
      const {loader, stubs} = makeLoader({
        shouldLoadAsEsm: jest.fn(p => !p.endsWith('.cjs')),
      });
      stubs.requireModuleOrMock.mockImplementation(() => {
        throw new CjsParseError(new SyntaxError('export is not defined'));
      });
      // TLA in the dep triggers hasAsyncGraph → LOAD_ASYNC, proving the dep
      // was enqueued as native ESM rather than crashing on CjsParseError.
      stubs.transformCache.transform.mockImplementation((modulePath: string) =>
        modulePath === '/dep.cjs'
          ? 'export const x = await Promise.resolve(1);'
          : "import {x} from './dep.cjs'; globalThis.__x = x;",
      );
      stubs.resolution.resolveEsm.mockReturnValue('/dep.cjs');

      const result = loader.tryLoadGraphSync(
        '/entry.mjs',
        '',
        'sync-preferred',
      );
      expect(result).toBe(LOAD_ASYNC);
    },
  );

  testWithLinkedSyntheticModule(
    'rethrows when an existing module mock is errored (importMockSync)',
    async () => {
      const {context, esmRegistry, loader, stubs} = makeLoader({
        mockState: {
          getEsmFactory: jest.fn(() => undefined),
          getEsmModuleId: jest.fn(() => '/dep.mjs'),
          shouldMockEsmSync: jest.fn((_from, name) => ({
            moduleID: name,
            shouldMock: true,
          })),
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

  test("returns 'load-async' when registry has a mid-flight Promise (legacy async load)", () => {
    const {esmRegistry, loader} = makeLoader();
    esmRegistry.set('/m.mjs', Promise.resolve());
    const result = loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred');
    expect(result).toBe(LOAD_ASYNC);
  });

  test("returns 'load-async' when transformCache holds a mutex on the root", () => {
    const {loader, stubs} = makeLoader({
      transformCache: {
        canTransformSync: jest.fn(() => true),
        hasMutex: jest.fn(() => true),
        transform: jest.fn(),
      } as unknown as jest.Mocked<TransformCache>,
    });
    const result = loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred');
    expect(result).toBe(LOAD_ASYNC);
    expect(stubs.transformCache.hasMutex).toHaveBeenCalledWith('/m.mjs');
  });

  testWithLinkedSyntheticModule(
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
      expect(result).not.toBe(LOAD_ASYNC);
      invariant(result !== LOAD_ASYNC, 'Asserted above by the expect');
      expect(result.namespace).toMatchObject({
        default: {foo: 'bar'},
        foo: 'bar',
      });
    },
  );

  test('sync-required mode rejects async transformers with ERR_REQUIRE_ASYNC_MODULE', () => {
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
  });

  test("sync-preferred mode bails ('load-async') on async-only transformer", () => {
    const {loader} = makeLoader({
      transformCache: {
        canTransformSync: jest.fn(() => false),
        hasMutex: jest.fn(() => false),
        transform: jest.fn(),
      } as unknown as jest.Mocked<TransformCache>,
    });
    const result = loader.tryLoadGraphSync('/m.mjs', '', 'sync-preferred');
    expect(result).toBe(LOAD_ASYNC);
  });
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
      expect(result).not.toBe(LOAD_ASYNC);
      expect(stubs.requireModuleOrMock).toHaveBeenCalledWith(
        '/entry.mjs',
        '/dep.cjs',
      );
      expect((context as any).__cjsBridgeOk).toBe('yes');
    },
  );

  testWithSyncEsm(
    'routes `@jest/globals` through jestGlobals.esmGlobalsModule',
    () => {
      const {context, loader, stubs} = makeLoader();
      stubs.jestGlobals.esmGlobalsModule.mockImplementation(
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
      expect(stubs.jestGlobals.esmGlobalsModule).toHaveBeenCalledWith(
        '/entry.mjs',
        context,
      );
      expect((context as any).__jest).toEqual({kind: 'jest-stub'});
    },
  );
});

describe('EsmLoader mock dispatch', () => {
  testWithLinkedSyntheticModule(
    'sync-required mode rejects async mock factory with ERR_REQUIRE_ASYNC_MODULE',
    () => {
      const {loader, stubs} = makeLoader({
        mockState: {
          getEsmFactory: jest.fn(() => () => Promise.resolve({})),
          getEsmModuleId: jest.fn(() => 'mid'),
          shouldMockEsmSync: jest.fn((_from, name) => ({
            moduleID: name,
            shouldMock: true,
          })),
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

  testWithLinkedSyntheticModule(
    "sync-preferred mode bails on async mock factory ('load-async')",
    () => {
      const {loader, stubs} = makeLoader({
        mockState: {
          getEsmFactory: jest.fn(() => () => Promise.resolve({})),
          getEsmModuleId: jest.fn(() => 'mid'),
          shouldMockEsmSync: jest.fn((_from, name) => ({
            moduleID: name,
            shouldMock: true,
          })),
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
      expect(result).toBe(LOAD_ASYNC);
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
          shouldMockEsmSync: jest.fn((_from, name) => ({
            moduleID: name,
            shouldMock: true,
          })),
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
      expect(result).not.toBe(LOAD_ASYNC);
      expect(factory).toHaveBeenCalled();
      expect((context as any).__mocked).toBe('value');
    },
  );
});

describe('EsmLoader.requireEsmModule', () => {
  testWithVmEsm(
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

  test('throws ERR_REQUIRE_ESM when the registry has a mid-flight Promise', () => {
    const {esmRegistry, loader} = makeLoader();
    esmRegistry.set('/m.mjs', Promise.resolve());
    expect(() => loader.requireEsmModule('/m.mjs')).toThrow(
      expect.objectContaining({
        code: 'ERR_REQUIRE_ESM',
        message: expect.stringContaining('concurrent'),
      }),
    );
  });
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
      // `linkAndEvaluateModule(errored)` - exactly the path the new guard
      // protects.
      esmRegistry.set('@jest/globals/from.mjs', errored);

      await expect(
        loader.dynamicImportFromCjs('@jest/globals', 'from.mjs', context),
      ).rejects.toThrow('original eval error');
    },
  );
});

describe('validateImportAttributes', () => {
  // Each test uses a unique modulePath/referencingIdentifier pair so the
  // deprecation-warn dedup cache (module-scoped in EsmLoader) doesn't suppress
  // across tests.
  let counter = 0;
  const uniquePaths = () => {
    counter += 1;
    return {
      js: `/test-${counter}.js`,
      json: `/test-${counter}.json`,
      referencer: `/referencer-${counter}.mjs`,
    };
  };

  describe('JSON modules', () => {
    test('accepts type: json', () => {
      const {json, referencer} = uniquePaths();
      expect(() =>
        validateImportAttributes(json, {type: 'json'}, referencer),
      ).not.toThrow();
    });

    test('throws ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE when type is wrong', () => {
      const {json, referencer} = uniquePaths();
      let error: NodeJS.ErrnoException | null = null;
      try {
        validateImportAttributes(json, {type: 'css'}, referencer);
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error).not.toBeNull();
      expect(error).toBeInstanceOf(TypeError);
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE');
      expect(error?.message).toMatch(/not of type "css"/);
    });

    test('warns once per (referencer, module) when no attribute is present', () => {
      const {json, referencer} = uniquePaths();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        validateImportAttributes(json, {}, referencer);
        validateImportAttributes(json, {}, referencer);
        validateImportAttributes(json, {}, referencer);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'importing JSON without an import attribute is deprecated',
          ),
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    test('warns again for a different referencer importing the same module', () => {
      const {json, referencer} = uniquePaths();
      const otherReferencer = `${referencer}-other`;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        validateImportAttributes(json, {}, referencer);
        validateImportAttributes(json, {}, otherReferencer);
        expect(warnSpy).toHaveBeenCalledTimes(2);
      } finally {
        warnSpy.mockRestore();
      }
    });

    test('treats data:application/json URIs as JSON modules', () => {
      const {referencer} = uniquePaths();
      const dataUri = 'data:application/json,{"x":1}';
      // type: 'json' is accepted
      expect(() =>
        validateImportAttributes(dataUri, {type: 'json'}, referencer),
      ).not.toThrow();
      // Wrong type is rejected
      let error: NodeJS.ErrnoException | null = null;
      try {
        validateImportAttributes(dataUri, {type: 'css'}, referencer);
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE');
    });

    test('truncates data: URI payload in the deprecation warning', () => {
      const {referencer} = uniquePaths();
      const huge = 'a'.repeat(10_000);
      const dataUri = `data:application/json,${encodeURIComponent(huge)}`;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        validateImportAttributes(dataUri, {}, referencer);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        const message = warnSpy.mock.calls[0][0];
        expect(message).toContain('data:application/json,…');
        expect(message).not.toContain(huge);
      } finally {
        warnSpy.mockRestore();
      }
    });

    test('warning mentions both static and dynamic syntax', () => {
      const {json, referencer} = uniquePaths();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        validateImportAttributes(json, {}, referencer);
        const message = warnSpy.mock.calls[0][0];
        expect(message).toContain("with { type: 'json' }");
        expect(message).toContain("{ with: { type: 'json' } }");
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  describe('non-JSON modules', () => {
    test('accepts no attributes', () => {
      const {js, referencer} = uniquePaths();
      expect(() => validateImportAttributes(js, {}, referencer)).not.toThrow();
    });

    test('throws ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE when type is set', () => {
      const {js, referencer} = uniquePaths();
      let error: NodeJS.ErrnoException | null = null;
      try {
        validateImportAttributes(js, {type: 'javascript'}, referencer);
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE');
      expect(error?.message).toMatch(/not of type "javascript"/);
    });

    test('throws when type: json is asserted on non-JSON', () => {
      const {js, referencer} = uniquePaths();
      let error: NodeJS.ErrnoException | null = null;
      try {
        validateImportAttributes(js, {type: 'json'}, referencer);
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE');
    });
  });

  describe('unknown attribute keys', () => {
    test('throws ERR_IMPORT_ATTRIBUTE_UNSUPPORTED on a JSON module', () => {
      const {json, referencer} = uniquePaths();
      let error: NodeJS.ErrnoException | null = null;
      try {
        validateImportAttributes(
          json,
          {cache: 'no-store', type: 'json'},
          referencer,
        );
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_UNSUPPORTED');
      expect(error?.message).toMatch(/Import attribute "cache"/);
    });

    test('throws ERR_IMPORT_ATTRIBUTE_UNSUPPORTED on a non-JSON module', () => {
      const {js, referencer} = uniquePaths();
      let error: NodeJS.ErrnoException | null = null;
      try {
        validateImportAttributes(js, {foo: 'bar'}, referencer);
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_UNSUPPORTED');
    });

    test('rejects unknown key before reporting type-mismatch', () => {
      // Unknown-key check is first per Node's `validateAttributes` order.
      const {json, referencer} = uniquePaths();
      let error: NodeJS.ErrnoException | null = null;
      try {
        validateImportAttributes(
          json,
          {nonsense: 'x', type: 'css'},
          referencer,
        );
      } catch (error_) {
        error = error_ as NodeJS.ErrnoException;
      }
      expect(error?.code).toBe('ERR_IMPORT_ATTRIBUTE_UNSUPPORTED');
    });
  });
});
