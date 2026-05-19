/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';

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

  testWithVmEsm('pulls a CJS dependency into the sync ESM graph', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-cjs-dep.mjs',
    )) as any;
    expect(m.namespace.cjsValue).toBe('from-cjs');
  });

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
    'throws ERR_REQUIRE_ESM when an `import()` of the same module is in flight',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const aPath = path.join(ROOT_DIR, 'a.mjs');
      // Simulate a concurrent `await import()` by stashing a pending Promise
      // in the registry under the key require() will look up.
      runtime.registries.setEsm(aPath, new Promise(() => {}));
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
      const entry = runtime.registries.getEsm(cjsPath);
      expect(entry).toBeDefined();
      expect(entry).not.toBeInstanceOf(Promise);
    },
  );
});
