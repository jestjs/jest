/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Tests for the ESM/CJS interoperability code added to jest-runtime:
//   loadCjsAsEsm - __esModule default-unwrapping, named-export filtering,
//   and CJS-as-ESM module caching (singleton guarantee).
//
// These tests require --experimental-vm-modules and are skipped otherwise.
// To run:
//   NODE_OPTIONS=--experimental-vm-modules node ./packages/jest-cli/bin/jest.js \
//     packages/jest-runtime/src/__tests__/runtime_esm_cjs_interop.test.ts

import * as path from 'path';
import {testWithSyncEsm, testWithVmEsm} from '@jest/test-utils';

const ROOT_DIR = path.join(__dirname, 'test_esm_interop_root');
const FROM = path.join(ROOT_DIR, 'test.js');

let createRuntime: (
  filename: string,
  config?: Record<string, unknown>,
) => Promise<any>;

describe('Runtime loadCjsAsEsm', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithVmEsm(
    'unwraps __esModule CJS default export instead of returning the whole exports object',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-babel-esmodule.mjs',
      )) as any;
      expect(m.namespace.default).toBe(42);
      expect(typeof m.namespace.default).not.toBe('object');
    },
  );

  testWithVmEsm(
    'does not expose __esModule sentinel as a named export',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-babel-esmodule.mjs',
      )) as any;
      expect(Object.keys(m.namespace)).not.toContain('__esModule');
    },
  );

  testWithVmEsm(
    'exposes named exports alongside default for __esModule CJS',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-babel-esmodule.mjs',
      )) as any;
      expect(m.namespace.named).toBe('hello');
    },
  );

  testWithVmEsm(
    'uses the full module.exports as default for plain CJS',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-plain-cjs.mjs',
      )) as any;
      expect(m.namespace.default).toEqual({
        double: expect.any(Function),
        value: 7,
      });
    },
  );

  testWithVmEsm(
    'exposes named exports from plain CJS module.exports keys',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-plain-cjs.mjs',
      )) as any;
      expect(m.namespace.value).toBe(7);
      expect(m.namespace.double(10)).toBe(20);
    },
  );

  testWithVmEsm(
    'shares singleton state across multiple ESM importers of the same CJS module',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const mA = (await runtime.unstable_importModule(
        FROM,
        './import-stateful-a.mjs',
      )) as any;
      mA.namespace.increment();
      mA.namespace.increment();
      const mB = (await runtime.unstable_importModule(
        FROM,
        './import-stateful-b.mjs',
      )) as any;
      expect(mB.namespace.getCount()).toBe(2);
    },
  );
});

describe('Runtime loadCjsAsEsm SyntaxError fallback', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  testWithVmEsm(
    'loads a .js file with ESM syntax that has no "type":"module" marker',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const m = (await runtime.unstable_importModule(
        FROM,
        './import-fake-esm-js.mjs',
      )) as any;
      expect(m.namespace.fakeEsmValue).toBe(123);
    },
  );

  testWithSyncEsm(
    'require()s a .js file with ESM syntax that has no "type":"module" marker',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      const ns = runtime.requireModule(FROM, './fake-esm-js.js');
      expect(ns.fakeEsmValue).toBe(123);
    },
  );

  // Runtime SyntaxError from inside the CJS body (vs. a parse-time one)
  // must not trigger the ESM fallback - surfacing the original error
  // unchanged is the right behavior.
  testWithVmEsm(
    'does not retry as ESM when the CJS body throws a runtime SyntaxError',
    async () => {
      const runtime = await createRuntime(__filename, {rootDir: ROOT_DIR});
      expect(() =>
        runtime.requireModule(FROM, './throws-syntaxerror.cjs'),
      ).toThrow('user-thrown SyntaxError from CJS body');
    },
  );
});
