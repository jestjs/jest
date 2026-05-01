/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';

import {SourceTextModule, SyntheticModule} from 'vm';
const vmAvailable = typeof SyntheticModule === 'function';
const itVm = vmAvailable ? it : it.skip;
const syncCoreAvailable =
  // @ts-expect-error - hasAsyncGraph is in Node v24.9+, not yet typed
  typeof SourceTextModule?.prototype.hasAsyncGraph === 'function';
const itSyncOnly = syncCoreAvailable ? it : it.skip;

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

  itVm('evaluates a diamond + cycle graph in correct order', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-diamond.mjs',
    )) as any;
    expect(m.namespace.fromA).toEqual({valueA: 'a', valueB: 'b', valueC: 'c'});
    expect(m.namespace.valueB).toBe('b');
    expect(m.namespace.valueC).toBe('c');
    expect(m.namespace.peekA()).toBe('a');
  });

  itVm(
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

  itVm(
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

  itVm('resolves data: URI specifiers in the sync graph', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-data-uri.mjs',
    )) as any;
    expect(m.namespace.dataValue).toBe(99);
  });

  itVm('resolves @jest/globals in the sync graph', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-jest-globals.mjs',
    )) as any;
    expect(m.namespace.hasJest).toBe(true);
  });

  itVm('decodes base64-encoded data: URI specifiers', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-data-uri-base64.mjs',
    )) as any;
    expect(m.namespace.base64Value).toBe('b64');
  });

  itVm('imports JSON files as ESM', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-json.mjs',
    )) as any;
    expect(m.namespace.data).toEqual({answer: 42, label: 'json'});
  });

  itVm('imports core node modules through the ESM graph', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-core.mjs',
    )) as any;
    expect(typeof m.namespace.EventEmitter).toBe('function');
    expect(typeof m.namespace.nodePath.join).toBe('function');
  });

  itVm('exposes import.meta.url for the loaded module', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-meta.mjs',
    )) as any;
    expect(m.namespace.url).toBe(
      `file://${path.join(ROOT_DIR, 'import-meta.mjs')}`,
    );
  });

  itVm('pulls a CJS dependency into the sync ESM graph', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-cjs-dep.mjs',
    )) as any;
    expect(m.namespace.cjsValue).toBe('from-cjs');
  });

  itVm('imports a wasm module via data: URI', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-wasm.mjs',
    )) as any;
    // Empty wasm module → namespace exists but has no exports.
    expect(m.namespace.wasmMod).toBeDefined();
    expect(Object.keys(m.namespace.wasmMod)).toEqual([]);
  });

  itVm('treats a query suffix as a separate cache entry', async () => {
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

  itVm('supports dynamic import() from inside an ESM module', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    const m = (await runtime.unstable_importModule(
      FROM,
      './import-dynamic.mjs',
    )) as any;
    const fromA = await m.namespace.loadA();
    expect(fromA).toEqual({valueA: 'a', valueB: 'b', valueC: 'c'});
  });
});

describe('Runtime sync ESM graph — mocks and isolation', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  itVm('replaces a module with a sync mock factory', async () => {
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

  itVm('replaces a module with an async mock factory', async () => {
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

  itVm('isolateModulesAsync gives a fresh ESM namespace', async () => {
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

describe('Runtime sync ESM graph — error surfacing', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  itVm('rejects when a specifier cannot be resolved', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    await expect(
      runtime.unstable_importModule(FROM, './does-not-exist.mjs'),
    ).rejects.toThrow('Cannot find module');
  });

  itVm('surfaces errors thrown by a mock factory', async () => {
    const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
    runtime.setModuleMock(FROM, './mock-target.mjs', () => {
      throw new Error('factory boom');
    });
    await expect(
      runtime.unstable_importModule(FROM, './import-throwing-mock.mjs'),
    ).rejects.toThrow('factory boom');
  });

  // Sync-core only: the legacy path leaks the SourceTextModule constructor
  // SyntaxError as an unhandled rejection through `_fileTransformsMutex`,
  // which crashes the process on Node v22. The sync core surfaces it cleanly.
  itSyncOnly(
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
