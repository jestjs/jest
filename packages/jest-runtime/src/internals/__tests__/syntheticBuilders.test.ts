/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type SyntheticModule, createContext} from 'node:vm';
import {testWithVmEsm} from '@jest/test-utils';
import type CjsExportsCache from '../CjsExportsCache';
import {
  buildCjsAsEsmSyntheticModule,
  buildCoreSyntheticModule,
  buildJestGlobalsSyntheticModule,
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
  });

  describe('buildJestGlobalsSyntheticModule', () => {
    testWithVmEsm(
      'merges environment globals with the jest object for the given `from`',
      async () => {
        const jestObject = {fn: 'jest-fn-marker'};
        const envGlobals = {describe: 'describe-marker', test: 'test-marker'};

        const m = buildJestGlobalsSyntheticModule(
          '/from.js',
          context(),
          () => jestObject as never,
          () => envGlobals as never,
        );
        const ns = await evaluate(m);

        expect(ns.jest).toBe(jestObject);
        expect(ns.test).toBe('test-marker');
        expect(ns.describe).toBe('describe-marker');
      },
    );

    testWithVmEsm('passes `from` to getJestObject', async () => {
      const getJestObject: jest.MockedFunction<(from: string) => never> =
        jest.fn(() => ({}) as never);
      buildJestGlobalsSyntheticModule(
        '/some/from.js',
        context(),
        getJestObject,
        () => ({}) as never,
      );
      expect(getJestObject).toHaveBeenCalledWith('/some/from.js');
    });
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

    testWithVmEsm('unwraps Babel-style __esModule + default', async () => {
      const cjs = {__esModule: true, default: {real: 'default'}, named: 'n'};
      const m = buildCjsAsEsmSyntheticModule(
        '/from.js',
        '/mod.cjs',
        context(),
        () => cjs,
        makeCache(['__esModule', 'default', 'named']),
      );
      const ns = await evaluate(m);
      // `__esModule` is a metadata flag, not exposed
      expect(ns.__esModule).toBeUndefined();
      // `default` named export is suppressed; the default unwraps to cjs.default
      expect(ns.default).toEqual({real: 'default'});
      expect(ns.named).toBe('n');
    });

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
