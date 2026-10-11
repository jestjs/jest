/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {pathToFileURL} from 'url';

import {
  testWithLinkedSyntheticModule,
  testWithSyncEsm,
  testWithVmEsm,
} from '@jest/test-utils';

const ROOT_DIR = path.join(__dirname, 'test_esm_sync_graph_root');
const FROM = path.join(ROOT_DIR, 'test.js');

let createRuntime: (
  filename: string,
  config?: Record<string, unknown>,
) => Promise<any>;

describe('Runtime sync ESM graph', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithVmEsm(
    'evaluates a diamond + cycle graph in correct order',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-diamond.mjs',
      )) as any;
      expect(m.namespace.fromA).toEqual({
        valueA: 'a',
        valueB: 'b',
        valueC: 'c',
      });
      expect(m.namespace.valueB).toBe('b');
      expect(m.namespace.valueC).toBe('c');
      expect(m.namespace.peekA()).toBe('a');
    },
  );

  testWithVmEsm(
    'caches modules so repeated imports return the same namespace',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const first = (await runtime.unstable_importModule(
        FROM,
        './a.mjs',
      )) as any;
      const second = (await runtime.unstable_importModule(
        FROM,
        './a.mjs',
      )) as any;
      expect(first.namespace).toBe(second.namespace);
    },
  );

  testWithVmEsm(
    'falls back to async evaluate when the graph contains top-level await',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-tla.mjs',
      )) as any;
      expect(m.namespace.value).toBe('tla-value');
      expect(m.namespace.wrapper).toBe('wrapper');
    },
  );

  testWithVmEsm('resolves data: URI specifiers in the sync graph', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-data-uri.mjs',
    )) as any;
    expect(m.namespace.dataValue).toBe(99);
  });

  testWithVmEsm('resolves @jest/globals in the sync graph', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-jest-globals.mjs',
    )) as any;
    expect(m.namespace.hasJest).toBe(true);
  });

  testWithVmEsm('decodes base64-encoded data: URI specifiers', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-data-uri-base64.mjs',
    )) as any;
    expect(m.namespace.base64Value).toBe('b64');
  });

  testWithVmEsm('imports JSON files as ESM', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-json.mjs',
    )) as any;
    expect(m.namespace.data).toEqual({answer: 42, label: 'json'});
  });

  testWithVmEsm(
    'keys a core root the same way it keys a core dependency',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});

      // `import-core.mjs` pulls in `node:path` as a dependency, which the
      // walker keys canonically. Importing the builtin as a *root* goes
      // through a separate branch, and must land on that same entry rather
      // than minting a second synthetic wrapper.
      const viaDep = (await runtime.unstable_importModule(
        FROM,
        './import-core.mjs',
      )) as any;
      const asRoot = (await runtime.unstable_importModule(
        FROM,
        'node:path',
      )) as any;

      expect(asRoot.namespace).toBe(viaDep.namespace.nodePath);
    },
  );

  testWithVmEsm('imports core node modules through the ESM graph', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-core.mjs',
    )) as any;
    expect(typeof m.namespace.EventEmitter).toBe('function');
    expect(typeof m.namespace.nodePath.join).toBe('function');
  });

  testWithVmEsm('exposes import.meta.url for the loaded module', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-meta.mjs',
    )) as any;
    expect(m.namespace.url).toBe(
      `file://${path.join(ROOT_DIR, 'import-meta.mjs')}`,
    );
  });

  testWithVmEsm('sets import.meta.main only for the test file', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const imported = (await runtime.unstable_importModule(
      FROM,
      './import-meta-main.mjs',
    )) as any;
    expect(imported.namespace.ownMain).toBe(false);
    expect(imported.namespace.depMain).toBe(false);

    const entryRuntime = await createRuntime(
      path.join(ROOT_DIR, 'meta-main.mjs'),
      {rootDir: ROOT_DIR},
    );
    const entry = (await entryRuntime.unstable_importModule(
      FROM,
      './meta-main.mjs',
    )) as any;
    expect(entry.namespace.mainValue).toBe(true);
  });

  testWithVmEsm('pulls a CJS dependency into the sync ESM graph', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-cjs-dep.mjs',
    )) as any;
    expect(m.namespace.cjsValue).toBe('from-cjs');
  });

  testWithVmEsm(
    "exposes a CJS dependency's exports as the 'module.exports' named export",
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-cjs-namespace.mjs',
      )) as any;
      expect(m.namespace.moduleExportsValue).toEqual({cjsValue: 'from-cjs'});
      expect(m.namespace.sameAsDefault).toBe(true);
    },
  );

  testWithVmEsm('imports a wasm module via data: URI', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-wasm.mjs',
    )) as any;
    // Empty wasm module → namespace exists but has no exports.
    expect(m.namespace.wasmMod).toBeDefined();
    expect(Object.keys(m.namespace.wasmMod)).toEqual([]);
  });

  testWithVmEsm('treats a query suffix as a separate cache entry', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const plain = (await runtime.unstable_importModule(FROM, './a.mjs')) as any;
    const queried = (await runtime.unstable_importModule(
      FROM,
      './a.mjs?v=2',
    )) as any;
    // Different cache entries → different module instances, but same shape.
    expect(queried.namespace).not.toBe(plain.namespace);
    expect(queried.namespace.fromA).toEqual(plain.namespace.fromA);
  });

  testWithVmEsm(
    'resolves a package-imports specifier through the `imports` field',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-package-imports.mjs',
      )) as any;
      expect(m.namespace.doubled).toBe(84);
      expect(m.namespace.viaWildcard).toBe('matched');
    },
  );

  testWithVmEsm(
    'imports a package-imports specifier directly, leading `#` and all',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        '#imports-dep',
      )) as any;
      expect(m.namespace.value).toBe(42);
    },
  );

  testWithVmEsm(
    'supports dynamic import() from inside an ESM module',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-dynamic.mjs',
      )) as any;
      const fromA = await m.namespace.loadA();
      expect(fromA).toEqual({valueA: 'a', valueB: 'b', valueC: 'c'});
    },
  );
});

describe('Runtime sync ESM graph - mocks and isolation', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithVmEsm('replaces a module with a sync mock factory', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    runtime.setModuleMock(FROM, './mock-target.mjs', () => ({
      greeting: 'mocked-sync',
    }));
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-mock-target.mjs',
    )) as any;
    expect(m.namespace.greeting).toBe('mocked-sync');
  });

  testWithVmEsm('replaces a module with an async mock factory', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    runtime.setModuleMock(FROM, './mock-target.mjs', async () => ({
      greeting: 'mocked-async',
    }));
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-mock-target.mjs',
    )) as any;
    expect(m.namespace.greeting).toBe('mocked-async');
  });

  testWithVmEsm(
    'a module mock first imported inside isolateModulesAsync does not leak out',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});

      let invocations = 0;
      runtime.setModuleMock(FROM, './mock-target.mjs', () => {
        invocations++;
        return {greeting: `mocked-${invocations}`};
      });

      let inside: any;
      await runtime.isolateModulesAsync(async () => {
        inside = (await runtime.unstable_importModule(
          FROM,
          './import-mock-target.mjs',
        )) as any;
      });
      expect(inside.namespace.greeting).toBe('mocked-1');

      const outside = (await runtime.unstable_importModule(
        FROM,
        './import-mock-target.mjs',
      )) as any;

      // The mock instance built inside the block must not be reused
      // afterwards - the factory runs again, as it does for a CommonJS mock.
      expect(outside.namespace.greeting).toBe('mocked-2');
      expect(invocations).toBe(2);
    },
  );

  testWithVmEsm('isolateModulesAsync gives a fresh ESM namespace', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});

    const before = (await runtime.unstable_importModule(
      FROM,
      './stateful.mjs',
    )) as any;
    before.namespace.increment();
    before.namespace.increment();
    expect(before.namespace.getCount()).toBe(2);

    let isolatedCount: number | undefined;
    await runtime.isolateModulesAsync(async () => {
      const inside = (await runtime.unstable_importModule(
        FROM,
        './stateful.mjs',
      )) as any;
      expect(inside.namespace).not.toBe(before.namespace);
      isolatedCount = inside.namespace.getCount();
    });
    expect(isolatedCount).toBe(0);

    // Outer registry survives the isolated block.
    expect(before.namespace.getCount()).toBe(2);
  });
});

describe('Runtime sync ESM graph - error surfacing', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithVmEsm('rejects when a specifier cannot be resolved', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    await expect(
      runtime.unstable_importModule(FROM, './does-not-exist.mjs'),
    ).rejects.toThrow('Cannot find module');
  });

  testWithVmEsm('surfaces errors thrown by a mock factory', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    runtime.setModuleMock(FROM, './mock-target.mjs', () => {
      throw new Error('factory boom');
    });
    await expect(
      runtime.unstable_importModule(FROM, './import-throwing-mock.mjs'),
    ).rejects.toThrow('factory boom');
  });

  // On the legacy async path (pre-sync-graph), `new SourceTextModule` throws
  // synchronously with no concurrent mutex awaiter — an unhandled rejection
  // that crashes the worker. Both paths must surface the error as a clean
  // rejection instead.
  testWithVmEsm(
    'rejects with a SyntaxError for ESM with parse errors',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      // Cross-realm: the SyntaxError comes from a vm sandbox, so match by name
      // instead of `instanceof SyntaxError`.
      await expect(
        runtime.unstable_importModule(FROM, './syntax-error.mjs'),
      ).rejects.toMatchObject({name: 'SyntaxError'});
    },
  );
});

describe('Runtime sync ESM graph - require(esm)', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithSyncEsm('returns the module namespace synchronously', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const ns = runtime.requireModule(FROM, './a.mjs');
    expect(ns.fromA).toEqual({valueA: 'a', valueB: 'b', valueC: 'c'});
    expect(ns.valueB).toBe('b');
    expect(ns.valueC).toBe('c');
  });

  testWithSyncEsm(
    'returns the same namespace on repeat require()',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const first = runtime.requireModule(FROM, './a.mjs');
      const second = runtime.requireModule(FROM, './a.mjs');
      expect(first).toBe(second);
    },
  );

  testWithSyncEsm(
    'throws ERR_REQUIRE_ASYNC_MODULE when the file uses top-level await',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      expect(() => runtime.requireModule(FROM, './with-tla.mjs')).toThrow(
        expect.objectContaining({code: 'ERR_REQUIRE_ASYNC_MODULE'}),
      );
    },
  );

  testWithSyncEsm(
    'throws ERR_REQUIRE_ASYNC_MODULE naming the dep when a dep uses TLA',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      expect(() => runtime.requireModule(FROM, './import-tla.mjs')).toThrow(
        expect.objectContaining({
          code: 'ERR_REQUIRE_ASYNC_MODULE',
          message: expect.stringMatching(/with-tla\.mjs/),
        }),
      );
    },
  );

  testWithSyncEsm(
    'marks a required module that has a default export with __esModule',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const result = runtime.requireModule(FROM, './with-default.mjs');
      expect(
        Object.getOwnPropertyDescriptor(result, '__esModule'),
      ).toStrictEqual({
        configurable: false,
        enumerable: true,
        value: true,
        writable: true,
      });
      expect(result.default).toBe('D');
      expect(result.x).toBe(1);
      expect(runtime.requireModule(FROM, './with-default.mjs')).toBe(result);
    },
  );

  testWithSyncEsm(
    'adds no __esModule marker without a default export',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const result = runtime.requireModule(FROM, './a.mjs');
      expect('__esModule' in result).toBe(false);
      expect(result.valueA).toBe('a');
    },
  );

  testWithSyncEsm("keeps a module's own __esModule export as-is", async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const result = runtime.requireModule(FROM, './own-esmodule.mjs');
    expect(result.__esModule).toBe(false);
    expect(result.default).toBe('overridden');
  });

  testWithSyncEsm('keeps live bindings through the facade', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const result = runtime.requireModule(FROM, './live-bindings.mjs');
    expect(result.__esModule).toBe(true);
    expect(result.counter).toBe(0);
    result.bump();
    expect(result.counter).toBe(1);
  });

  testWithSyncEsm('exposes the require() result on require.cache', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const probe = runtime.requireModule(FROM, './reads-cache-for-esm.cjs');
    expect(probe.cacheMatchesRequire).toBe(true);
  });

  testWithSyncEsm(
    'throws ERR_REQUIRE_CYCLE_MODULE when a CJS dep requires back into the graph',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      expect(() => runtime.requireModule(FROM, './cycle-root.mjs')).toThrow(
        expect.objectContaining({
          code: 'ERR_REQUIRE_CYCLE_MODULE',
          message: expect.stringMatching(
            /Cannot require\(\) ES Module .*cycle-root\.mjs in a cycle\. \(from .*requires-cycle-root\.cjs\)/,
          ),
        }),
      );
    },
  );

  testWithSyncEsm(
    'throws ERR_REQUIRE_CYCLE_MODULE for a self-require during evaluation',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const ns = runtime.requireModule(FROM, './eval-time-cycle.mjs');
      expect(ns.observed).toBe('ERR_REQUIRE_CYCLE_MODULE');
    },
  );

  testWithSyncEsm(
    'throws ERR_REQUIRE_CYCLE_MODULE across nested walks',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const ns = runtime.requireModule(FROM, './deep-cycle-root.mjs');
      expect(ns.rootOneValue).toBe(1);
      const probe = runtime.requireModule(FROM, './requires-first-root.cjs');
      expect(probe.observed).toBe('ERR_REQUIRE_CYCLE_MODULE');
    },
  );

  testWithSyncEsm(
    'scopes cycle detection to the registry the walk runs against',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const ns = runtime.requireModule(FROM, './isolation-reentry-root.mjs');
      expect(ns.outerValue).toBe('outer');
      const probe = runtime.requireModule(FROM, './isolates-same-root.cjs');
      expect(probe.isolated.outerValue).toBe('outer');
      expect(probe.isolated).not.toBe(ns);
    },
  );

  testWithSyncEsm(
    'allows a CJS dep to require an unrelated ESM root mid-walk',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const ns = runtime.requireModule(FROM, './nested-walk-root.mjs');
      expect(ns.rootValue).toBe('root');
      const unrelated = runtime.requireModule(FROM, './requires-unrelated.cjs');
      expect(unrelated.otherValue).toBe('sibling');
    },
  );

  testWithSyncEsm(
    'serves an already-evaluated module to a CJS dep mid-walk',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const first = runtime.requireModule(FROM, './a.mjs');
      const ns = runtime.requireModule(FROM, './reuse-evaluated-root.mjs');
      expect(ns.reuseValue).toBe('reuse-root');
      const probe = runtime.requireModule(FROM, './requires-evaluated.cjs');
      expect(probe.aValue).toBe(first.valueA);
    },
  );

  testWithSyncEsm(
    'throws ERR_REQUIRE_ASYNC_MODULE for an async mock factory',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      runtime.setModuleMock(FROM, './mock-target.mjs', async () => ({
        greeting: 'never',
      }));
      expect(() =>
        runtime.requireModule(FROM, './import-mock-target.mjs'),
      ).toThrow(expect.objectContaining({code: 'ERR_REQUIRE_ASYNC_MODULE'}));
    },
  );

  testWithSyncEsm(
    'invokes an async mock factory once across sync bail and async retry',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      let factoryCalls = 0;
      runtime.setModuleMock(FROM, './mock-target.mjs', async () => {
        factoryCalls++;
        return {greeting: 'mocked-async'};
      });
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-mock-target.mjs',
      )) as any;
      expect(m.namespace.greeting).toBe('mocked-async');
      expect(factoryCalls).toBe(1);
    },
  );

  testWithSyncEsm(
    'a rejecting async mock factory rejects the import',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      runtime.setModuleMock(FROM, './mock-target.mjs', async () => {
        throw new Error('factory failed');
      });
      await expect(
        runtime.unstable_importModule(FROM, './import-mock-target.mjs'),
      ).rejects.toThrow('factory failed');
    },
  );

  testWithSyncEsm(
    'honors jest.unstable_mockModule for transitive deps',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      runtime.setModuleMock(FROM, './mock-target.mjs', () => ({
        greeting: 'mocked-via-require',
      }));
      const ns = runtime.requireModule(FROM, './import-mock-target.mjs');
      expect(ns.greeting).toBe('mocked-via-require');
    },
  );

  testWithSyncEsm(
    'require(esm) with an async-only resolver throws ERR_REQUIRE_ASYNC_MODULE',
    async () => {
      const runtime = await createRuntime(__filename, {
        resolver: path.join(ROOT_DIR, 'async-only-resolver.cjs'),
        rootDir: ROOT_DIR,
      });
      expect(() => runtime.requireModule(FROM, './a.mjs')).toThrow(
        expect.objectContaining({code: 'ERR_REQUIRE_ASYNC_MODULE'}),
      );
    },
  );

  // Sync require() resolution falls back to the default resolver when the
  // configured resolver is async-only - long-standing behavior for CJS and
  // ESM targets alike, and gating all of require() on a sync resolver would
  // break configs where the fallback resolves correctly. The
  // ERR_REQUIRE_ASYNC_MODULE guard therefore only covers entries the
  // fallback resolved to an ESM file.
  testWithSyncEsm(
    'require() of a name only the async resolver can map fails to resolve',
    async () => {
      const runtime = await createRuntime(__filename, {
        resolver: path.join(ROOT_DIR, 'async-only-resolver.cjs'),
        rootDir: ROOT_DIR,
      });
      expect(() => runtime.requireModule(FROM, 'async-alias-esm')).toThrow(
        "Cannot find module 'async-alias-esm'",
      );
      expect(() => runtime.requireModule(FROM, 'async-alias-cjs')).toThrow(
        "Cannot find module 'async-alias-cjs'",
      );
    },
  );

  testWithSyncEsm(
    'honors jest.unstable_mockModule for the require()d file itself',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      runtime.setModuleMock(FROM, './mock-target.mjs', () => ({
        greeting: 'mocked-root',
      }));
      const ns = runtime.requireModule(FROM, './mock-target.mjs');
      expect(ns.greeting).toBe('mocked-root');
    },
  );

  testWithSyncEsm(
    'repeated require() of a mocked ESM file returns the same instance',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      runtime.setModuleMock(FROM, './mock-target.mjs', () => ({
        greeting: 'mocked-instance',
      }));
      const first = runtime.requireModule(FROM, './mock-target.mjs');
      const second = runtime.requireModule(FROM, './mock-target.mjs');
      expect(first.greeting).toBe('mocked-instance');
      expect(second).toBe(first);
    },
  );

  testWithSyncEsm(
    'requireActual bypasses unstable_mockModule for an ESM target',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      runtime.setModuleMock(FROM, './mock-target.mjs', () => ({
        greeting: 'mocked-root',
      }));
      const ns = runtime.requireActual(FROM, './mock-target.mjs');
      expect(ns.greeting).toBe('real');
    },
  );

  testWithSyncEsm(
    'require() of a root mock with an async factory throws ERR_REQUIRE_ASYNC_MODULE',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      runtime.setModuleMock(FROM, './mock-target.mjs', async () => ({
        greeting: 'never',
      }));
      expect(() => runtime.requireModule(FROM, './mock-target.mjs')).toThrow(
        expect.objectContaining({code: 'ERR_REQUIRE_ASYNC_MODULE'}),
      );
    },
  );

  testWithSyncEsm(
    'honors jest.unstable_mockModule for a data: URI dependency',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      runtime.setModuleMock(
        FROM,
        'data:text/javascript,export const value = "real"',
        () => ({value: 'mocked'}),
      );
      const ns = runtime.requireModule(FROM, './import-data-uri-mocked.mjs');
      expect(ns.value).toBe('mocked');
    },
  );

  testWithSyncEsm(
    'jest.mock (CJS map) does not apply to an ESM target',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      runtime.setMock(FROM, './a.mjs', () => ({mocked: true}));
      const ns = runtime.requireModule(FROM, './a.mjs');
      expect(ns.mocked).toBeUndefined();
      expect(ns.fromA).toEqual({valueA: 'a', valueB: 'b', valueC: 'c'});
    },
  );

  testWithSyncEsm('exposes ESM entries via require.cache', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const aPath = path.join(ROOT_DIR, 'a.mjs');
    const ns = runtime.requireModule(FROM, './a.mjs');
    // Read `require.cache` from a CJS context inside the runtime - the
    // Proxy is per-require so we can't observe it from out here.
    const probe = runtime.requireModule(FROM, './read-require-cache.cjs');
    const entry = probe.entry(aPath);
    expect(entry.exports).toBe(ns);
    expect(entry.id).toBe(aPath);
    expect(entry.filename).toBe(aPath);
    expect(entry.path).toBe(path.dirname(aPath));
    expect(entry.loaded).toBe(true);
    expect(Array.isArray(entry.paths)).toBe(true);
    expect(entry.paths).toContain(path.join(ROOT_DIR, 'node_modules'));
    expect(probe.has(aPath)).toBe(true);
    expect(probe.keys()).toContain(aPath);
  });

  testWithSyncEsm(
    'returns the same require.cache wrapper on repeat reads',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const aPath = path.join(ROOT_DIR, 'a.mjs');
      runtime.requireModule(FROM, './a.mjs');
      const probe = runtime.requireModule(FROM, './read-require-cache.cjs');
      expect(probe.entry(aPath)).toBe(probe.entry(aPath));
    },
  );

  testWithSyncEsm(
    'require.cache wrapper rejects calls to its `require` field',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const aPath = path.join(ROOT_DIR, 'a.mjs');
      runtime.requireModule(FROM, './a.mjs');
      const probe = runtime.requireModule(FROM, './read-require-cache.cjs');
      expect(() => probe.callRequireOnEntry(aPath)).toThrow(
        'require() on a require.cache ESM entry is not supported',
      );
    },
  );

  testWithSyncEsm(
    'require()s an ESM file that pulls in a CJS dep',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const ns = runtime.requireModule(FROM, './import-cjs-dep.mjs');
      expect(ns.cjsValue).toBe('from-cjs');
    },
  );

  testWithSyncEsm(
    'require()s an ESM file importing @jest/globals',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const ns = runtime.requireModule(FROM, './import-jest-globals.mjs');
      expect(ns.hasJest).toBe(true);
    },
  );

  testWithSyncEsm('require()s an ESM file importing a JSON dep', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const ns = runtime.requireModule(FROM, './import-json.mjs');
    expect(ns.data).toEqual({answer: 42, label: 'json'});
  });

  testWithSyncEsm(
    'imported JSON objects belong to the test realm, like require()d ones',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const imported = runtime.requireModule(FROM, './import-json.mjs');
      const required = runtime.requireModule(FROM, './data.json');
      expect(Object.getPrototypeOf(imported.data)).toBe(
        Object.getPrototypeOf(required),
      );
    },
  );

  testWithSyncEsm('imports a JSON dep that starts with a BOM', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const ns = runtime.requireModule(FROM, './import-bom-json.mjs');
    expect(ns.key).toBe('bom-value');
  });

  testWithVmEsm('imports a JSON module that starts with a BOM', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(FROM, './bom.json')) as any;
    expect(m.namespace.default).toEqual({key: 'bom-value'});
  });

  testWithVmEsm(
    'imports a JSON module through an async-only transformer',
    async () => {
      const runtime = await createRuntime(__filename, {
        rootDir: ROOT_DIR,
        transform: {
          '\\.json$': path.join(ROOT_DIR, 'async-json-transformer.cjs'),
        },
      });
      const m = (await runtime.unstable_importModule(
        FROM,
        './bom.json',
      )) as any;
      expect(m.namespace.default).toEqual({key: 'bom-value'});
    },
  );

  testWithSyncEsm('require()s an ESM file with a data: URI dep', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const ns = runtime.requireModule(FROM, './import-data-uri.mjs');
    expect(ns.dataValue).toBe(99);
  });

  testWithSyncEsm(
    'throws ERR_REQUIRE_ASYNC_MODULE when a data: URI dep uses TLA',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      expect(() =>
        runtime.requireModule(FROM, './import-data-uri-tla.mjs'),
      ).toThrow(expect.objectContaining({code: 'ERR_REQUIRE_ASYNC_MODULE'}));
    },
  );

  testWithSyncEsm(
    'surfaces an error thrown during ESM module evaluation',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      expect(() => runtime.requireModule(FROM, './throws-at-eval.mjs')).toThrow(
        'boom from esm eval',
      );
    },
  );

  testWithSyncEsm(
    'rethrows the original error when requiring a module that already failed',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      expect(() => runtime.requireModule(FROM, './throws-at-eval.mjs')).toThrow(
        'boom from esm eval',
      );
      expect(() => runtime.requireModule(FROM, './throws-at-eval.mjs')).toThrow(
        'boom from esm eval',
      );
    },
  );

  testWithSyncEsm(
    'evaluates a module left linked when a sibling threw',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      expect(() =>
        runtime.requireModule(FROM, './import-throwing-then-sibling.mjs'),
      ).toThrow('boom from esm eval');
      const ns = runtime.requireModule(FROM, './linked-sibling.mjs');
      expect(ns.value).toBe('sibling');
    },
  );

  testWithSyncEsm(
    'adopts a linked module as a dependency of a later graph',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      expect(() =>
        runtime.requireModule(FROM, './import-throwing-then-sibling.mjs'),
      ).toThrow('boom from esm eval');

      // A fresh root pulls the leftover in as a *dependency*, so it is adopted
      // into the scratch graph and evaluated by the root's cascade rather than
      // taking the root cache branch.
      const ns = runtime.requireModule(FROM, './import-linked-sibling.mjs');
      expect(ns.value).toBe('sibling');
      expect(ns.wrapper).toBe('wrapper');
    },
  );

  testWithSyncEsm(
    'rejects a concurrent import() whose sibling evaluated the module to an error',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      // An async-only resolver forces the legacy path even on Node with sync
      // evaluate; there, the first caller's sync-branch evaluation stores no
      // promise in `evaluatingMap`, so the second caller must re-read the
      // status after its awaits instead of returning the errored module.
      runtime._resolution.canResolveSync = () => false;

      const results = await Promise.allSettled([
        runtime.unstable_importModule(
          FROM,
          './import-throwing-then-sibling.mjs',
        ),
        runtime.unstable_importModule(
          FROM,
          './import-throwing-then-sibling.mjs',
        ),
      ]);

      expect(results.map(result => result.status)).toEqual([
        'rejected',
        'rejected',
      ]);
      for (const result of results) {
        expect((result as PromiseRejectedResult).reason.message).toBe(
          'boom from esm eval',
        );
      }
    },
  );

  testWithSyncEsm(
    'reports the same top-level await error when a failed graph is required again',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const expected = expect.objectContaining({
        code: 'ERR_REQUIRE_ASYNC_MODULE',
        message: expect.stringMatching(/top-level await/),
      });
      expect(() =>
        runtime.requireModule(FROM, './import-cjs-then-tla.mjs'),
      ).toThrow(expected);
      expect(() =>
        runtime.requireModule(FROM, './import-cjs-then-tla.mjs'),
      ).toThrow(expected);
    },
  );

  testWithSyncEsm(
    'throws ERR_REQUIRE_ESM when an `import()` of the same module is in flight',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const aPath = path.join(ROOT_DIR, 'a.mjs');
      // Simulate a concurrent `await import()` by stashing a pending Promise
      // in the registry under the key require() will look up.
      runtime.registries
        .getActiveEsmRegistry()
        .set(pathToFileURL(aPath).href, new Promise(() => {}));
      expect(() => runtime.requireModule(FROM, './a.mjs')).toThrow(
        expect.objectContaining({
          code: 'ERR_REQUIRE_ESM',
          message: expect.stringContaining(
            'currently being loaded by a concurrent',
          ),
        }),
      );
    },
  );

  testWithSyncEsm(
    'a require() of a second root mid-walk shares overlapping dependencies',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './overlap-root.mjs',
      )) as any;
      expect(m.namespace.sameInstance).toBe(true);
      expect(m.namespace.evaluations).toBe(1);
    },
  );

  testWithSyncEsm(
    'a require() of a second root mid-walk shares dependencies the outer walk scratched first',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './overlap-root-lifo.mjs',
      )) as any;
      expect(m.namespace.sameInstance).toBe(true);
      expect(m.namespace.evaluations).toBe(1);
    },
  );

  testWithSyncEsm(
    'a require() of a second root mid-walk shares a scratched JSON module',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './overlap-json-root.mjs',
      )) as any;
      expect(m.namespace.sameJson).toBe(true);
    },
  );

  testWithSyncEsm(
    'a require() whose graph reaches the walked root throws ERR_REQUIRE_CYCLE_MODULE',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './cycle-through-nested-root.mjs',
      )) as any;
      expect(m.namespace.observed).toBe('ERR_REQUIRE_CYCLE_MODULE');
    },
  );

  testWithSyncEsm(
    'a dynamic import() fired from a CJS body mid-walk settles on the walked instance',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './reentrant-import-root.mjs',
      )) as any;
      const reentrant = await m.namespace.promiseFromCjs;
      expect(reentrant).toBe(m.namespace);
      expect(reentrant.marker).toBe('reentrant-root');
      expect(reentrant.evaluations).toBe(1);
    },
  );

  testWithLinkedSyntheticModule(
    'dynamic import of a CJS dep stores the actual module in the ESM registry, not a Promise',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './dynamic-cjs.mjs',
      )) as any;
      await m.namespace.loadCjs();

      const cjsPath = path.join(ROOT_DIR, 'cjs-dep.cjs');
      const entry = runtime.registries
        .getActiveEsmRegistry()
        .get(pathToFileURL(cjsPath).href);
      expect(entry).toBeDefined();
      expect(entry).not.toBeInstanceOf(Promise);
    },
  );
});

describe('Runtime sync ESM graph - URL-keyed module instances', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithVmEsm(
    'shares an instance for an identical query and separates every other URL',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const importStateful = async (specifier: string) =>
        (await runtime.unstable_importModule(FROM, specifier)) as any;

      const queryA = await importStateful('./stateful.mjs?a');
      const queryAAgain = await importStateful('./stateful.mjs?a');
      const queryB = await importStateful('./stateful.mjs?b');
      const plain = await importStateful('./stateful.mjs');
      const fragment = await importStateful('./stateful.mjs#frag');
      const doubleQuery = await importStateful('./stateful.mjs?a?b');

      expect(queryAAgain.namespace).toBe(queryA.namespace);
      const namespaces = new Set([
        queryA.namespace,
        queryB.namespace,
        plain.namespace,
        fragment.namespace,
        doubleQuery.namespace,
      ]);
      expect(namespaces.size).toBe(5);
    },
  );

  testWithVmEsm(
    'a file: URL specifier shares the instance of its relative spelling',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const relative = (await runtime.unstable_importModule(
        FROM,
        './stateful.mjs?a',
      )) as any;
      const statefulUrl = pathToFileURL(
        path.join(ROOT_DIR, 'stateful.mjs'),
      ).href;
      const viaUrl = (await runtime.unstable_importModule(
        FROM,
        `${statefulUrl}?a`,
      )) as any;
      expect(viaUrl.namespace).toBe(relative.namespace);
    },
  );

  testWithVmEsm(
    'a query on one extension never collides with a neighboring extension',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-keyed-collision.mjs',
      )) as any;
      expect(m.namespace.queried).toBe('js');
      expect(m.namespace.neighbor).toBe('jsx');
    },
  );

  testWithVmEsm(
    'query variants of a CJS module get distinct namespaces over one evaluation',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-cjs-query-variants.mjs',
      )) as any;
      expect(m.namespace.distinctNamespaces).toBe(true);
      expect(m.namespace.sharedExports).toBe(true);
    },
  );

  testWithVmEsm(
    'serializes the suffix, sharing percent-encoded spellings like Node',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const raw = (await runtime.unstable_importModule(
        FROM,
        './url-reporter.mjs?é',
      )) as any;
      const encoded = (await runtime.unstable_importModule(
        FROM,
        './url-reporter.mjs?%C3%A9',
      )) as any;
      expect(encoded.namespace).toBe(raw.namespace);
      const reporterUrl = pathToFileURL(
        path.join(ROOT_DIR, 'url-reporter.mjs'),
      ).href;
      expect(raw.namespace.url).toBe(`${reporterUrl}?%C3%A9`);
    },
  );

  testWithVmEsm(
    'an empty query or fragment names the plain module, like Node',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const plain = (await runtime.unstable_importModule(
        FROM,
        './url-reporter.mjs',
      )) as any;
      const emptyQuery = (await runtime.unstable_importModule(
        FROM,
        './url-reporter.mjs?',
      )) as any;
      const emptyFragment = (await runtime.unstable_importModule(
        FROM,
        './url-reporter.mjs#',
      )) as any;
      const emptyQueryWithFragment = (await runtime.unstable_importModule(
        FROM,
        './url-reporter.mjs?#frag',
      )) as any;
      const fragmentOnly = (await runtime.unstable_importModule(
        FROM,
        './url-reporter.mjs#frag',
      )) as any;

      expect(emptyQuery.namespace).toBe(plain.namespace);
      expect(emptyFragment.namespace).toBe(plain.namespace);
      expect(emptyQueryWithFragment.namespace).toBe(fragmentOnly.namespace);
      expect(fragmentOnly.namespace).not.toBe(plain.namespace);
    },
  );

  testWithVmEsm(
    'carries a query on a package-imports specifier onto the target',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const plain = (await runtime.unstable_importModule(
        FROM,
        '#imports-root/url-reporter.mjs',
      )) as any;
      const queried = (await runtime.unstable_importModule(
        FROM,
        '#imports-root/url-reporter.mjs?v=2',
      )) as any;
      const reporterUrl = pathToFileURL(
        path.join(ROOT_DIR, 'url-reporter.mjs'),
      ).href;

      expect(plain.namespace.url).toBe(reporterUrl);
      expect(queried.namespace.url).toBe(`${reporterUrl}?v=2`);
      expect(queried.namespace).not.toBe(plain.namespace);
    },
  );

  testWithVmEsm(
    'accepts file: URLs without an authority and with an upper-case scheme',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const reporterPath = path.join(ROOT_DIR, 'url-reporter.mjs');
      const relative = (await runtime.unstable_importModule(
        FROM,
        './url-reporter.mjs',
      )) as any;
      const singleSlash = (await runtime.unstable_importModule(
        FROM,
        `file:${reporterPath}`,
      )) as any;
      const upperCaseScheme = (await runtime.unstable_importModule(
        FROM,
        pathToFileURL(reporterPath).href.replace(/^file:/, 'FILE:'),
      )) as any;
      expect(singleSlash.namespace).toBe(relative.namespace);
      expect(upperCaseScheme.namespace).toBe(relative.namespace);
    },
  );

  testWithVmEsm('import.meta.url carries the query and fragment', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './url-reporter.mjs?tag=1#frag',
    )) as any;
    const reporterUrl = pathToFileURL(
      path.join(ROOT_DIR, 'url-reporter.mjs'),
    ).href;
    expect(m.namespace.url).toBe(`${reporterUrl}?tag=1#frag`);
  });

  testWithVmEsm(
    'import.meta.resolve keeps the query and fragment and echoes node: specifiers',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './meta-resolve-suffix.mjs',
      )) as any;
      const aUrl = pathToFileURL(path.join(ROOT_DIR, 'a.mjs')).href;
      expect(m.namespace.relative).toBe(`${aUrl}?q=1#frag`);
      expect(m.namespace.builtinEcho).toBe('node:fs?q');
    },
  );

  testWithVmEsm(
    'a core specifier with a query is an unknown builtin',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(FROM, 'node:fs?q'),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'ERR_UNKNOWN_BUILTIN_MODULE',
          message: 'No such built-in module: node:fs?q',
        }),
      );
    },
  );
});

describe('Runtime sync ESM graph - data: URI modules', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithVmEsm(
    'provides import.meta.jest and import.meta.resolve',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-data-uri-meta.mjs',
      )) as any;
      expect(m.namespace.hasJest).toBe('object');
      expect(m.namespace.resolveType).toBe('function');
      expect(m.namespace.absolute).toBe('node:fs');
      expect(m.namespace.builtin).toBe('node:fs');
      expect(m.namespace.relativeError).toBe('ERR_UNSUPPORTED_RESOLVE_REQUEST');
      expect(m.namespace.bareError).toBe('ERR_UNSUPPORTED_RESOLVE_REQUEST');
    },
  );

  testWithVmEsm('accepts an upper-case charset parameter', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-data-uri-upper-charset.mjs',
    )) as any;
    expect(m.namespace.x).toBe(1);
  });

  testWithVmEsm(
    'rejects an unsupported mime type with ERR_UNKNOWN_MODULE_FORMAT',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(FROM, './import-data-uri-bad-mime.mjs'),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'ERR_UNKNOWN_MODULE_FORMAT',
          message: 'Unknown module format: text/html for URL data:text/html,hi',
        }),
      );
    },
  );

  testWithVmEsm('rejects a mime-less data: URI like Node', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    await expect(
      runtime.unstable_importModule(FROM, './import-data-uri-no-mime.mjs'),
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'ERR_UNKNOWN_MODULE_FORMAT',
        message: 'Unknown module format: null for URL data:,hello',
      }),
    );
  });

  testWithVmEsm(
    'rejects a malformed data: URI with ERR_INVALID_URL',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(FROM, './import-data-uri-invalid.mjs'),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'ERR_INVALID_URL',
          message: 'Invalid URL',
        }),
      );
    },
  );
});

describe('Runtime sync ESM graph - data: URI mediatype parsing', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithVmEsm('accepts an upper-case mime type', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-data-uri-upper-mime.mjs',
    )) as any;
    expect(m.namespace.upper).toBe(1);
  });

  testWithVmEsm(
    'decodes base64 given as the final of several parameters',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-data-uri-multi-params.mjs',
      )) as any;
      expect(m.namespace.multi).toBe(2);
    },
  );

  testWithVmEsm('keeps a URL fragment out of the module source', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-data-uri-fragment.mjs',
    )) as any;
    expect(m.namespace.fragmentDefault).toBe(1);
  });

  testWithVmEsm(
    'percent-decodes a base64 payload before decoding',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-data-uri-escaped-base64.mjs',
      )) as any;
      expect(m.namespace.escaped).toBe(42);
    },
  );

  testWithVmEsm('strips whitespace around the mime type', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-data-uri-space-mime.mjs',
    )) as any;
    expect(m.namespace.s).toBe(1);
  });

  testWithVmEsm(
    'whitespace spellings of one data: URI share an instance with a canonical import.meta.url',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-data-uri-tab-alias.mjs',
      )) as any;
      expect(m.namespace.sameInstance).toBe(true);
      expect(m.namespace.url).toBe(
        'data:text/javascript,export const url = import.meta.url;',
      );
    },
  );

  // Node's percent-decoding is forgiving: an invalid escape sequence passes
  // through instead of throwing.
  testWithVmEsm('loads a payload with a malformed percent escape', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-data-uri-bad-percent.mjs',
    )) as any;
    expect(m.namespace.m).toBe('\u{FFFD}%A');
  });

  testWithVmEsm(
    'rejects invalid base64 with ERR_INVALID_URL like Node',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(
          FROM,
          './import-data-uri-invalid-base64.mjs',
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'ERR_INVALID_URL',
          message: 'Invalid URL',
        }),
      );
    },
  );

  // In a URL the fragment starts at the first #, so a fragment before the
  // comma leaves the data: URL without a payload.
  testWithVmEsm(
    'rejects a fragment before the comma with ERR_INVALID_URL',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(
          FROM,
          './import-data-uri-early-fragment.mjs',
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'ERR_INVALID_URL',
          message: 'Invalid URL',
        }),
      );
    },
  );

  // Node echoes the mime essence in the rejection only when it parses as a
  // MIME type, and reports null otherwise.
  testWithVmEsm('reports null for an unparseable mime essence', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    await expect(
      runtime.unstable_importModule(
        FROM,
        './import-data-uri-unparseable-mime.mjs',
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'ERR_UNKNOWN_MODULE_FORMAT',
        message:
          'Unknown module format: null for URL data:text%2Fjavascript,export const q = 1',
      }),
    );
  });

  // The payload decode runs before the format check, so an invalid base64
  // body wins over an unknown mime type.
  testWithVmEsm(
    'reports ERR_INVALID_URL for bad base64 even with an unknown mime',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(
          FROM,
          './import-data-uri-bad-mime-bad-base64.mjs',
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'ERR_INVALID_URL',
          message: 'Invalid URL',
        }),
      );
    },
  );

  // Only the JavaScript mime tolerates surrounding spaces - application/json
  // must match exactly, and the rejection echoes the mediatype verbatim.
  testWithVmEsm(
    'rejects application/json with a leading space like Node',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(FROM, './import-data-uri-space-json.mjs'),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'ERR_UNKNOWN_MODULE_FORMAT',
          message:
            'Unknown module format:  application/json for URL data: application/json,{}',
        }),
      );
    },
  );

  // The URL parser strips ASCII tab and newline from the specifier entirely.
  testWithVmEsm('strips a tab inside the mediatype', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-data-uri-tab-mime.mjs',
    )) as any;
    expect(m.namespace.tabbed).toBe(1);
  });

  // Node never sees a literal non-ASCII character around the base64 token
  // (its URL parser percent-encodes it), so the parameter is not recognized,
  // the payload stays percent-decoded base64 text, and parsing that as
  // JavaScript fails on the trailing padding.
  testWithVmEsm(
    'does not honor a base64 parameter padded with Unicode whitespace',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(
          FROM,
          './import-data-uri-nbsp-base64.mjs',
        ),
      ).rejects.toThrow('Unexpected end of input');
    },
  );

  testWithVmEsm('accepts the application/javascript mime type', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-data-uri-application-mime.mjs',
    )) as any;
    expect(m.namespace.appJs).toBe(3);
  });

  // Node matches the JavaScript mime case-insensitively but requires exact
  // case for application/json, and reports the original spelling.
  testWithVmEsm(
    'rejects an upper-case application/json mime type like Node',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(FROM, './import-data-uri-upper-json.mjs'),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'ERR_UNKNOWN_MODULE_FORMAT',
          message:
            'Unknown module format: APPLICATION/JSON for URL data:APPLICATION/JSON,{}',
        }),
      );
    },
  );
});

describe('Runtime sync ESM graph - require.cache proxy in isolation', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithSyncEsm(
    'exposes an isolated ESM entry consistently across proxy traps',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      let result: any;
      runtime.isolateModules(() => {
        result = runtime.requireModule(FROM, './reads-cache-traps.cjs');
      });
      expect(result.entryExports).toBeDefined();
      expect(result.hasEntry).toBe(true);
      expect(result.listed).toBe(true);
      expect(result.selfEntry).toBeDefined();
      expect(result.selfHasEntry).toBe(true);
      expect(result.selfListed).toBe(true);
    },
  );
});

describe('Runtime sync ESM graph - automock', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithSyncEsm('require() automocks an ESM module', async () => {
    const runtime = await createRuntime(__filename, {
      automock: true,
      rootDir: ROOT_DIR,
    });
    const exports = runtime.requireModule(FROM, './automock-dep.mjs');
    expect(exports.greet._isMockFunction).toBe(true);
    expect(exports.greet()).toBeUndefined();
    expect(exports.value).toBe(42);
  });

  testWithSyncEsm('automocks the ESM deps of an imported module', async () => {
    const runtime = await createRuntime(__filename, {
      automock: true,
      rootDir: ROOT_DIR,
    });
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-automock-dep.mjs',
    )) as any;
    expect(m.namespace.greetIsMock).toBe(true);
    expect(m.namespace.greetResult).toBeUndefined();
    expect(m.namespace.depValue).toBe(42);
  });

  testWithSyncEsm(
    'require() and import share one automock instance',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
      });
      const required = runtime.requireModule(FROM, './automock-dep.mjs');
      const imported = (await runtime.unstable_importModule(
        FROM,
        './import-automock-dep.mjs',
      )) as any;
      expect(imported.namespace.greet).toBe(required.greet);
    },
  );

  testWithSyncEsm(
    'a sibling __mocks__ file wins over the generated automock',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
      });
      const exports = runtime.requireModule(FROM, './automock-manual-dep.mjs');
      expect(exports.kind).toBe('mocked-manual');
    },
  );

  testWithSyncEsm(
    'requireModuleOrMock serves the ESM manual mock and the automock',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
      });
      const manual = runtime.requireModuleOrMock(
        FROM,
        './automock-manual-dep.mjs',
      );
      expect(manual.kind).toBe('mocked-manual');
      const generated = runtime.requireModuleOrMock(FROM, './automock-dep.mjs');
      expect(generated.greet._isMockFunction).toBe(true);
      expect(generated.value).toBe(42);
    },
  );

  testWithSyncEsm(
    'jest.mock without a factory automocks an ESM target',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const {jest: jestObject} = runtime.requireModuleOrMock(
        FROM,
        '@jest/globals',
      );
      jestObject.mock('./automock-dep.mjs');
      const exports = runtime.requireModuleOrMock(FROM, './automock-dep.mjs');
      expect(exports.greet._isMockFunction).toBe(true);
    },
  );

  testWithSyncEsm('automocks a CJS dep of an ESM graph', async () => {
    const runtime = await createRuntime(__filename, {
      automock: true,
      rootDir: ROOT_DIR,
    });
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-automock-cjs-dep.mjs',
    )) as any;
    expect(m.namespace.runIsMock).toBe(true);
    expect(m.namespace.cjsTag).toBe('real-cjs');
  });

  testWithSyncEsm('automocks a dynamically imported ESM dep', async () => {
    const runtime = await createRuntime(__filename, {
      automock: true,
      rootDir: ROOT_DIR,
    });
    const m = (await runtime.unstable_importModule(
      FROM,
      './automock-dynamic.mjs',
    )) as any;
    expect(m.namespace.dep.greet._isMockFunction).toBe(true);
    expect(m.namespace.dep.value).toBe(42);
  });

  testWithSyncEsm(
    'mocks the file each condition set resolves for a conditional package',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
      });
      const required = runtime.requireModuleOrMock(FROM, 'dual-conditions-pkg');
      expect(required.syncOnly._isMockFunction).toBe(true);
      expect(required.importOnly).toBeUndefined();
    },
  );

  testWithSyncEsm(
    'picks the sibling mock of the file each condition set resolves',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
      });
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-dual-manual-pkg.mjs',
      )) as any;
      expect(m.namespace.mockKind).toBe('mocked-import-target');
      const required = runtime.requireModuleOrMock(
        FROM,
        'dual-conditions-manual-pkg',
      );
      expect(required.mockKind).toBe('mocked-sync-target');
    },
  );

  testWithSyncEsm(
    'a dual-hook resolver keeps the factory error for a dynamic import',
    async () => {
      // Generation is sync-only and would resolve the real graph's deps with
      // the sync hook - the wrong graph when the hooks disagree - so
      // factory-less mocks under a dual-hook resolver stay unsupported.
      const runtime = await createRuntime(__filename, {
        automock: true,
        resolver: path.join(ROOT_DIR, 'dual-hook-resolver.cjs'),
        rootDir: ROOT_DIR,
      });
      const loadDualAlias = runtime.requireModule(
        FROM,
        './dynamic-imports-dual-alias.cjs',
      );
      await expect(loadDualAlias()).rejects.toThrow(
        'Attempting to import a mock without a factory',
      );
    },
  );
  testWithSyncEsm(
    'a root __mocks__ entry for an unresolvable name serves dynamic imports',
    async () => {
      // The default test config only crawls .js, and root __mocks__ entries
      // resolve through the haste map - the .mjs mock must be indexed.
      const runtime = await createRuntime(__filename, {
        automock: true,
        moduleFileExtensions: ['js', 'mjs', 'cjs', 'json'],
        rootDir: ROOT_DIR,
      });
      const loadGhost = runtime.requireModule(
        FROM,
        './dynamic-imports-ghost.cjs',
      );
      const namespace = await loadGhost();
      expect(namespace.kind).toBe('mocked-ghost');
    },
  );

  testWithSyncEsm(
    'an async-only resolver still fails require() of an automocked ESM target',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        resolver: path.join(ROOT_DIR, 'async-only-resolver.cjs'),
        rootDir: ROOT_DIR,
      });
      expect(() =>
        runtime.requireModuleOrMock(FROM, './automock-dep.mjs'),
      ).toThrow(expect.objectContaining({code: 'ERR_REQUIRE_ASYNC_MODULE'}));
    },
  );

  testWithSyncEsm(
    'require() and import share one instance of a root manual mock',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        moduleFileExtensions: ['js', 'mjs', 'cjs', 'json'],
        rootDir: ROOT_DIR,
      });
      const required = runtime.requireModuleOrMock(FROM, 'rooted-mock-pkg');
      expect(required.marker).toEqual({kind: 'rooted-mock'});
      const imported = (await runtime.unstable_importModule(
        FROM,
        './import-rooted-mock-pkg.mjs',
      )) as any;
      expect(imported.namespace.marker).toBe(required.marker);
    },
  );
  testWithSyncEsm('automocks a statically imported data: URI', async () => {
    const runtime = await createRuntime(__filename, {
      automock: true,
      rootDir: ROOT_DIR,
    });
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-data-uri-automock.mjs',
    )) as any;
    expect(m.namespace.mocked._isMockFunction).toBe(true);
    expect(m.namespace.mocked()).toBeUndefined();
    expect(m.namespace.value).toBe(7);
  });

  testWithSyncEsm('automocks a dynamically imported data: URI', async () => {
    const runtime = await createRuntime(__filename, {
      automock: true,
      rootDir: ROOT_DIR,
    });
    const loadDataUri = runtime.requireModule(
      FROM,
      './dynamic-imports-data-uri.cjs',
    );
    const namespace = await loadDataUri();
    expect(namespace.mocked._isMockFunction).toBe(true);
    expect(namespace.value).toBe(7);
  });
  testWithSyncEsm(
    'validates JSON attributes against the resolved automock target',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        moduleFileExtensions: ['js', 'mjs', 'cjs', 'json'],
        rootDir: ROOT_DIR,
      });
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-automock-json-extensionless.mjs',
      )) as any;
      expect(m.namespace.data.answer).toBe(42);
    },
  );

  testWithSyncEsm(
    'validates JSON attributes for a dynamically imported automock target',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        moduleFileExtensions: ['js', 'mjs', 'cjs', 'json'],
        rootDir: ROOT_DIR,
      });
      const loadJson = runtime.requireModule(
        FROM,
        './dynamic-imports-automock-json.cjs',
      );
      const namespace = await loadJson();
      expect(namespace.default.answer).toBe(42);
    },
  );

  testWithSyncEsm(
    'a dual-hook resolver keeps the factory error for a static import',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        resolver: path.join(ROOT_DIR, 'dual-hook-resolver.cjs'),
        rootDir: ROOT_DIR,
      });
      await expect(
        runtime.unstable_importModule(FROM, './import-dual-alias-static.mjs'),
      ).rejects.toThrow('Attempting to import a mock without a factory');
    },
  );
  testWithSyncEsm(
    'imports honor the async hook when the two hooks disagree',
    async () => {
      const runtime = await createRuntime(__filename, {
        resolver: path.join(ROOT_DIR, 'disagreeing-hook-resolver.cjs'),
        rootDir: ROOT_DIR,
      });
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-disagreeing-alias.mjs',
      )) as any;
      expect(m.namespace.greet()).toBe('real');
      expect(m.namespace.kind).toBeUndefined();
      // A fresh runtime: the wrapper is one module instance per registry,
      // and the import above already evaluated it with the async target.
      const requireRuntime = await createRuntime(__filename, {
        resolver: path.join(ROOT_DIR, 'disagreeing-hook-resolver.cjs'),
        rootDir: ROOT_DIR,
      });
      const required = requireRuntime.requireModule(
        FROM,
        './import-disagreeing-alias.mjs',
      );
      expect(required.kind).toBe('real-manual');
      expect(required.greet).toBeUndefined();
    },
  );

  testWithSyncEsm(
    'jest.unmock makes require() return the real module',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
      });
      const {jest: jestObject} = runtime.requireModuleOrMock(
        FROM,
        '@jest/globals',
      );
      jestObject.unmock('./automock-dep.mjs');
      const exports = runtime.requireModuleOrMock(FROM, './automock-dep.mjs');
      expect(exports.greet()).toBe('real');
    },
  );

  testWithSyncEsm(
    'an unstable_mockModule factory survives a CJS jest.unmock',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const {jest: jestObject} = runtime.requireModuleOrMock(
        FROM,
        '@jest/globals',
      );
      jestObject.unstable_mockModule('./automock-dep.mjs', () => ({
        greet: () => 'factory',
      }));
      jestObject.unmock('./automock-dep.mjs');
      const exports = runtime.requireModuleOrMock(FROM, './automock-dep.mjs');
      expect(exports.greet()).toBe('factory');
    },
  );

  testWithSyncEsm(
    'require-shaped metadata does not poison a later import of the same file',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
      });
      const required = runtime.requireModuleOrMock(
        FROM,
        './automock-cjs-dep.cjs',
      );
      expect(required.run._isMockFunction).toBe(true);
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-automock-cjs-dep.mjs',
      )) as any;
      expect(m.namespace.runIsMock).toBe(true);
    },
  );

  testWithSyncEsm(
    'data: spellings that serialize to one URL share a mock instance',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
      });
      const loadVariants = runtime.requireModule(
        FROM,
        './dynamic-imports-data-uri-variants.cjs',
      );
      const [first, second] = await loadVariants();
      expect(first.mocked._isMockFunction).toBe(true);
      expect(first.mocked).toBe(second.mocked);
    },
  );
  testWithSyncEsm(
    'a factory registered under a non-canonical data: spelling serves',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const {jest: jestObject} = runtime.requireModuleOrMock(
        FROM,
        '@jest/globals',
      );
      const fixture = runtime.requireModule(
        FROM,
        './dynamic-imports-data-uri-tab.cjs',
      );
      jestObject.unstable_mockModule(fixture.uri, () => ({
        mocked: () => 'factory',
      }));
      const namespace = await fixture.load();
      expect(namespace.mocked()).toBe('factory');
    },
  );

  testWithSyncEsm(
    'jest.unmock of a root-mocked bare package returns the real module',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        moduleFileExtensions: ['js', 'mjs', 'cjs', 'json'],
        rootDir: ROOT_DIR,
      });
      const {jest: jestObject} = runtime.requireModuleOrMock(
        FROM,
        '@jest/globals',
      );
      jestObject.unmock('rooted-mock-pkg');
      const exports = runtime.requireModuleOrMock(FROM, 'rooted-mock-pkg');
      expect(exports.marker).toEqual({kind: 'real'});
    },
  );
  testWithSyncEsm(
    'require() and import share one automock of an unmarked ESM file',
    async () => {
      // With no transform the .js file keeps its ESM syntax and loads
      // through the parse-error fallback - the mock probe must classify it
      // the same way, or the CJS generateMock would automock the
      // ESM-generated mock a second time.
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
        transform: {},
      });
      const required = runtime.requireModuleOrMock(
        FROM,
        './unmarked-esm-mock-dep.js',
      );
      expect(required.tag._isMockFunction).toBe(true);
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-unmarked-esm-mock.mjs',
      )) as any;
      expect(m.namespace.tag).toBe(required.tag);
    },
  );

  testWithSyncEsm(
    'jest.deepUnmock keeps ESM dependencies real for require()',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
      });
      const {jest: jestObject} = runtime.requireModuleOrMock(
        FROM,
        '@jest/globals',
      );
      jestObject.deepUnmock('./import-automock-dep.mjs');
      const exports = runtime.requireModuleOrMock(
        FROM,
        './import-automock-dep.mjs',
      );
      expect(exports.greetIsMock).toBe(false);
      expect(exports.greetResult).toBe('real');
    },
  );

  testWithSyncEsm(
    'a require-generated mock is not reused by import under a dual-hook resolver',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        resolver: path.join(ROOT_DIR, 'dual-hook-resolver.cjs'),
        rootDir: ROOT_DIR,
      });
      const required = runtime.requireModuleOrMock(FROM, './automock-dep.mjs');
      expect(required.greet._isMockFunction).toBe(true);
      const loadDualAlias = runtime.requireModule(
        FROM,
        './dynamic-imports-dual-alias.cjs',
      );
      await expect(loadDualAlias()).rejects.toThrow(
        'Attempting to import a mock without a factory',
      );
    },
  );
  testWithSyncEsm('automocks a synchronously evaluable ESM cycle', async () => {
    const runtime = await createRuntime(__filename, {
      automock: true,
      rootDir: ROOT_DIR,
    });
    const exports = runtime.requireModule(FROM, './automock-cycle-a.mjs');
    expect(exports.fromA).toBe('a');
    expect(exports.readB._isMockFunction).toBe(true);
  });

  testWithSyncEsm('requireActual bypasses the automock', async () => {
    const runtime = await createRuntime(__filename, {
      automock: true,
      rootDir: ROOT_DIR,
    });
    const actual = runtime.requireActual(FROM, './automock-dep.mjs');
    expect(actual.greet._isMockFunction).toBeUndefined();
    expect(actual.greet()).toBe('real');
  });

  testWithSyncEsm(
    'unmockedModulePathPatterns loads the real module',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
        unmockedModulePathPatterns: ['automock-dep'],
      });
      const exports = runtime.requireModule(FROM, './automock-dep.mjs');
      expect(exports.greet()).toBe('real');
    },
  );
});

describe('Runtime sync ESM graph - link-time errors before CJS execution', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithSyncEsm(
    'a sibling resolution error surfaces before any CJS dep executes',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(FROM, './import-cjs-then-missing.mjs'),
      ).rejects.toThrow("Cannot find module './does-not-exist.js'");
      expect(runtime._environment.global.__cjsSideEffectRan).toBeUndefined();
    },
  );

  testWithSyncEsm(
    'an invalid import attribute surfaces before the CJS dep executes',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(FROM, './import-cjs-bad-attribute.mjs'),
      ).rejects.toThrow('is not of type "json"');
      expect(runtime._environment.global.__cjsSideEffectRan).toBeUndefined();
    },
  );

  testWithSyncEsm(
    'require() of the same graphs fails without executing the CJS dep',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      expect(() =>
        runtime.requireModule(FROM, './import-cjs-then-missing.mjs'),
      ).toThrow("Cannot find module './does-not-exist.js'");
      expect(() =>
        runtime.requireModule(FROM, './import-cjs-bad-attribute.mjs'),
      ).toThrow('is not of type "json"');
      expect(runtime._environment.global.__cjsSideEffectRan).toBeUndefined();
    },
  );

  testWithSyncEsm(
    'automock generation waits for the graph to resolve',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
      });
      await expect(
        runtime.unstable_importModule(
          FROM,
          './import-automock-then-missing.mjs',
        ),
      ).rejects.toThrow("Cannot find module './does-not-exist.js'");
      expect(
        runtime._environment.global.__automockSideEffectRan,
      ).toBeUndefined();
    },
  );

  testWithSyncEsm(
    'a resolver with a distinct async hook gets the legacy retry',
    async () => {
      const runtime = await createRuntime(__filename, {
        resolver: path.join(ROOT_DIR, 'dual-hook-resolver.cjs'),
        rootDir: ROOT_DIR,
      });
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-dual-alias.mjs',
      )) as any;
      expect(m.namespace.valueA).toBe('a');
    },
  );

  testWithSyncEsm(
    'a sync mock factory does not run when a sibling fails to resolve',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      let factoryRan = false;
      runtime.setModuleMock(FROM, './mock-target.mjs', () => {
        factoryRan = true;
        return {greeting: 'mocked'};
      });
      await expect(
        runtime.unstable_importModule(
          FROM,
          './import-factory-then-missing.mjs',
        ),
      ).rejects.toThrow("Cannot find module './does-not-exist.js'");
      expect(factoryRan).toBe(false);
    },
  );

  testWithSyncEsm(
    'a pending build that turns out to be unmarked ESM defers CJS siblings',
    async () => {
      // With no transform the .js file keeps its ESM syntax, so it can only
      // be classified by the walker itself - the scenario this test pins.
      const runtime = await createRuntime(__filename, {
        rootDir: ROOT_DIR,
        transform: {},
      });
      await expect(
        runtime.unstable_importModule(
          FROM,
          './import-cjs-then-unmarked-esm.mjs',
        ),
      ).rejects.toThrow("Cannot find module './does-not-exist.js'");
      expect(runtime._environment.global.__cjsSideEffectRan).toBeUndefined();
    },
  );
});

describe('Runtime sync ESM graph - source phase imports', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithSyncEsm(
    'throws an actionable error for a static import source',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(FROM, './import-source-phase.mjs'),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'ERR_SOURCE_PHASE_NOT_DEFINED',
          message: expect.stringContaining('source phase imports'),
        }),
      );
      expect(() =>
        runtime.requireModule(FROM, './import-source-phase.mjs'),
      ).toThrow(
        expect.objectContaining({code: 'ERR_SOURCE_PHASE_NOT_DEFINED'}),
      );
    },
  );

  testWithSyncEsm(
    'rejects a dynamic import.source() with the same error',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './dynamic-source-phase.mjs',
      )) as any;
      await expect(m.namespace.loadSource()).rejects.toThrow(
        expect.objectContaining({code: 'ERR_SOURCE_PHASE_NOT_DEFINED'}),
      );
    },
  );

  testWithSyncEsm(
    'throws through the legacy loader when top-level await forces it',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await expect(
        runtime.unstable_importModule(FROM, './import-source-after-tla.mjs'),
      ).rejects.toThrow(
        expect.objectContaining({code: 'ERR_SOURCE_PHASE_NOT_DEFINED'}),
      );
    },
  );

  testWithSyncEsm(
    'rejects import.source() called from a CJS module',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const loadSource = runtime.requireModule(
        FROM,
        './dynamic-source-phase.cjs',
      );
      await expect(loadSource()).rejects.toThrow(
        expect.objectContaining({code: 'ERR_SOURCE_PHASE_NOT_DEFINED'}),
      );
    },
  );
});

describe('Runtime sync ESM graph - require.cache key hygiene', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithSyncEsm(
    'exposes only path keys, never mock or synthetic registry keys',
    async () => {
      const runtime = await createRuntime(__filename, {
        automock: true,
        rootDir: ROOT_DIR,
      });
      const probe = runtime.requireModule(FROM, './reads-cache-keys.cjs');
      expect(probe.depIsMocked).toBe(true);
      expect(probe.keys.every((key: string) => path.isAbsolute(key))).toBe(
        true,
      );
    },
  );

  testWithSyncEsm(
    'keeps @jest/globals and core entries out of require.cache',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      await runtime.unstable_importModule(FROM, './import-jest-globals.mjs');
      await runtime.unstable_importModule(FROM, './import-core.mjs');
      const probe = runtime.requireModule(FROM, './reads-cache-keys.cjs');
      expect(probe.keys.every((key: string) => path.isAbsolute(key))).toBe(
        true,
      );
    },
  );
});
