/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

let createRuntime;

describe('Runtime', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  describe('requireModule', () => {
    it('emulates a node stack trace during module load', async () => {
      const runtime = await createRuntime(__filename);
      let hasThrown = false;
      try {
        runtime.requireModule(runtime.__mockRootPath, './throwing.js');
      } catch (error) {
        hasThrown = true;
        expect(error.stack).toMatch(/^Error: throwing\s+at Object.<anonymous>/);
      }
      expect(hasThrown).toBe(true);
    });

    it('emulates a node stack trace during function execution', async () => {
      const runtime = await createRuntime(__filename);
      let hasThrown = false;
      const sum = runtime.requireModule(
        runtime.__mockRootPath,
        './throwing_fn.js',
      );

      try {
        sum();
      } catch (error) {
        hasThrown = true;
        if (process.platform === 'win32') {
          expect(error.stack).toMatch(
            /^Error: throwing fn\s+at sum.+\\__tests__\\test_root\\throwing_fn\.js/,
          );
        } else {
          expect(error.stack).toMatch(
            /^Error: throwing fn\s+at sum.+\/__tests__\/test_root\/throwing_fn\.js/,
          );
        }
      }
      expect(hasThrown).toBe(true);
    });
  });

  describe('process.getBuiltinModule', () => {
    const itOnSupportedNodes =
      typeof process.getBuiltinModule === 'function' ? it : it.skip;

    itOnSupportedNodes('serves the sandbox process and module', async () => {
      const runtime = await createRuntime(__filename);
      const sandboxProcess = runtime._environment.global.process;
      expect(sandboxProcess.getBuiltinModule('process')).toBe(sandboxProcess);
      expect(sandboxProcess.getBuiltinModule('node:process')).toBe(
        sandboxProcess,
      );
      expect(sandboxProcess.getBuiltinModule('module')).toBe(
        runtime.requireModule(runtime.__mockRootPath, 'node:module'),
      );
    });

    itOnSupportedNodes(
      'serves builtins and undefined for unknown names',
      async () => {
        const runtime = await createRuntime(__filename);
        const sandboxProcess = runtime._environment.global.process;
        expect(sandboxProcess.getBuiltinModule('fs')).toBe(
          runtime.requireModule(runtime.__mockRootPath, 'fs'),
        );
        expect(
          sandboxProcess.getBuiltinModule('not-a-builtin'),
        ).toBeUndefined();
      },
    );
  });
});
