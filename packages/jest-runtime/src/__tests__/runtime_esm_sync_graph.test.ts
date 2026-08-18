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
