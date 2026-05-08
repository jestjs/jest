/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type SyntheticModule, createContext} from 'node:vm';
import {testWithVmEsm} from '@jest/test-utils';
import type {CjsExportsCache} from '../CjsExportsCache';
import {
  buildCjsAsEsmSyntheticModule,
  buildCoreSyntheticModule,
  buildJsonSyntheticModule,
  evaluateSyntheticModule,
} from '../syntheticBuilders';

async function evaluate(
  module: SyntheticModule,
): Promise<Record<string, unknown>> {
  await evaluateSyntheticModule(module);

  return module.namespace as Record<string, unknown>;
}

const context = () => createContext({});

describe('syntheticBuilders', () => {
  describe('buildJsonSyntheticModule', () => {
    testWithVmEsm('exposes parsed JSON as default export', async () => {
      const m = buildJsonSyntheticModule(
        '{"a": 1, "b": "two"}',
        '/file.json',
        context(),
      );
      const ns = await evaluate(m);
      expect(ns.default).toEqual({a: 1, b: 'two'});
    });
  });

  describe('buildCoreSyntheticModule', () => {
    testWithVmEsm(
      'exposes the required core module under default + named exports',
      async () => {
        const required = {readFile: () => 'r', writeFile: () => 'w'};
        const requireCoreModule: jest.MockedFunction<
          (name: string, supportPrefix: boolean) => unknown
        > = jest.fn(() => required);

        const m = buildCoreSyntheticModule('fs', context(), requireCoreModule);
        const ns = await evaluate(m);

        expect(requireCoreModule).toHaveBeenCalledWith('fs', true);
        expect(ns.default).toBe(required);
        expect(ns.readFile).toBe(required.readFile);
        expect(ns.writeFile).toBe(required.writeFile);
      },
    );

    testWithVmEsm(
      'default export is the whole required object even when it has a `default` key',
      async () => {
        // ESM-from-CJS interop convention (non-`__esModule`): `import x from
        // 'core'` binds `x` to the whole `module.exports`, not to
        // `module.exports.default`. None of the shipped Node cores have a
        // `default` key today, but if one ever does we still want the
        // default-import to mean "the whole module". Note: `import x` and
        // `import {default as x}` are the same binding in ESM - both resolve
        // to the namespace's `default`, which we set to the whole `required`.
        const required = {default: 'inner-default-value', named: 'n'};
        const m = buildCoreSyntheticModule(
          'fake-core',
          context(),
          () => required,
        );
        const ns = await evaluate(m);

        // The whole `required` is the default; `required.default` ('inner-…')
        // is shadowed by the explicit `default` set after the spread.
        expect(ns.default).toBe(required);
        expect((ns as any).default.default).toBe('inner-default-value');
        expect(ns.named).toBe('n');
      },
    );
  });

  describe('buildCjsAsEsmSyntheticModule', () => {
    function makeCache(parsedExports: Iterable<string>) {
      return {
        getExportsOf: jest.fn(() => new Set(parsedExports)),
      } as unknown as CjsExportsCache;
    }

    testWithVmEsm(
      'wraps a plain CJS object as named exports + default',
      async () => {
        const cjs = {bar: 2, foo: 1};
        const requireModuleOrMock = jest.fn(() => cjs);
        const m = buildCjsAsEsmSyntheticModule(
          '/from.js',
          '/mod.cjs',
          context(),
          requireModuleOrMock,
          makeCache(['foo', 'bar']),
        );
        const ns = await evaluate(m);
        expect(ns.foo).toBe(1);
        expect(ns.bar).toBe(2);
        expect(ns.default).toBe(cjs);
      },
    );

    testWithVmEsm(
      'uses whole module.exports as default for __esModule CJS (Node-aligned)',
      async () => {
        const cjs = {__esModule: true, default: {real: 'default'}, named: 'n'};
        const m = buildCjsAsEsmSyntheticModule(
          '/from.js',
          '/mod.cjs',
          context(),
          () => cjs,
          makeCache(['__esModule', 'default', 'named']),
        );
        const ns = await evaluate(m);
        // default is always the whole module.exports, no __esModule unwrapping
        expect(ns.default).toBe(cjs);
        // __esModule is exposed as a named export, matching Node behavior
        expect(ns.__esModule).toBe(true);
        expect(ns.named).toBe('n');
      },
    );

    testWithVmEsm('handles non-object module.exports', async () => {
      const m = buildCjsAsEsmSyntheticModule(
        '/from.js',
        '/mod.cjs',
        context(),
        () => null,
        makeCache([]),
      );
      const ns = await evaluate(m);
      expect(ns.default).toBeNull();
    });

    testWithVmEsm(
      'merges runtime keys with the lexer-parsed export list',
      async () => {
        // Lexer reports `foo`; runtime object also has `bar` (e.g. from
        // Object.assign). Both should appear as named exports.
        const cjs = {bar: 2, foo: 1};
        const m = buildCjsAsEsmSyntheticModule(
          '/from.js',
          '/mod.cjs',
          context(),
          () => cjs,
          makeCache(['foo']),
        );
        const ns = await evaluate(m);
        expect(ns.foo).toBe(1);
        expect(ns.bar).toBe(2);
      },
    );
  });

  // `buildWasmSyntheticModule` is exercised by the `nativeEsm` e2e suite,
  // which loads `e2e/native-esm/add.wasm`. A unit test would have to
  // hand-roll wasm bytecode and pull `WebAssembly` types into the test
  // typecheck config; the e2e coverage is sufficient.
});
