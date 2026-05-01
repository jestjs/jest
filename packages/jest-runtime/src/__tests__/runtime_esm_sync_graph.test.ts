/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Tests for the sync ESM graph loader (`_tryLoadEsmGraphSync` /
// `_loadEsmGraph`) added on the rework-esm-support branch. On Node v24.9+ the
// runtime walks the static ESM graph synchronously via `linkRequests` /
// `instantiate` and evaluates it sync; older Node falls back to the legacy
// `module.link(asyncLinker)` path. Both paths must produce identical
// observable behavior, so these tests run on every Node with vm-modules.
//
// To run:
//   NODE_OPTIONS=--experimental-vm-modules node ./packages/jest-cli/bin/jest.js \
//     packages/jest-runtime/src/__tests__/runtime_esm_sync_graph.test.ts

import * as path from 'path';

const {SyntheticModule} = require('vm') as typeof import('vm');
const vmAvailable = typeof SyntheticModule === 'function';
const itVm = vmAvailable ? it : it.skip;

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
});
