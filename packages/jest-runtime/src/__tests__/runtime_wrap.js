/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

let createRuntime;

describe('Runtime', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  describe('constructInjectedModuleParameters', () => {
    it('generates the correct args', async () => {
      const runtime = await createRuntime(__filename);

      expect(runtime.constructInjectedModuleParameters()).toEqual([
        'module',
        'exports',
        'require',
        '__dirname',
        '__filename',
        'jest',
      ]);
    });

    it('injects "extra globals"', async () => {
      const runtime = await createRuntime(__filename, {
        sandboxInjectedGlobals: ['Math'],
      });

      expect(runtime.constructInjectedModuleParameters()).toEqual([
        'module',
        'exports',
        'require',
        '__dirname',
        '__filename',
        'jest',
        'Math',
      ]);
    });

    it('avoid injecting `jest` if `injectGlobals = false`', async () => {
      const runtime = await createRuntime(__filename, {
        injectGlobals: false,
      });

      expect(runtime.constructInjectedModuleParameters()).toEqual([
        'module',
        'exports',
        'require',
        '__dirname',
        '__filename',
      ]);
    });
  });
});
