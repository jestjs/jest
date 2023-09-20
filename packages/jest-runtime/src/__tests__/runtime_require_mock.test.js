/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

let createRuntime;
const consoleWarn = console.warn;

describe('Runtime', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  afterEach(() => {
    console.warn = consoleWarn;
  });

  describe('requireMock', () => {
    it('uses manual mocks before attempting to automock', async () => {
      const runtime = await createRuntime(__filename);
      const exports = runtime.requireMock(
        runtime.__mockRootPath,
        'ManuallyMocked',
      );
      expect(exports.isManualMockModule).toBe(true);
    });

    it('can resolve modules that are only referenced from mocks', async () => {
      const runtime = await createRuntime(__filename);
      const exports = runtime.requireMock(
        runtime.__mockRootPath,
        'ManuallyMocked',
      );
      expect(exports.onlyRequiredFromMockModuleValue).toBe(
        'banana banana banana',
      );
    });

    it('stores and re-uses manual mock exports', async () => {
      const runtime = await createRuntime(__filename);
      let exports = runtime.requireMock(
        runtime.__mockRootPath,
        'ManuallyMocked',
      );
      exports.setModuleStateValue('test value');
      exports = runtime.requireMock(runtime.__mockRootPath, 'ManuallyMocked');
      expect(exports.getModuleStateValue()).toBe('test value');
    });

    it('automocks haste modules without a manual mock', async () => {
      const runtime = await createRuntime(__filename);
      const exports = runtime.requireMock(
        runtime.__mockRootPath,
        'RegularModule',
      );
      expect(exports.getModuleStateValue._isMockFunction).toBe(true);
    });

    it('automocks relative-path modules without a file extension', async () => {
      const runtime = await createRuntime(__filename);
      const exports = runtime.requireMock(
        __filename,
        './test_root/RegularModule',
      );
      expect(exports.getModuleStateValue._isMockFunction).toBe(true);
    });

    it('automocks relative-path modules with a file extension', async () => {
      const runtime = await createRuntime(__filename);
      const exports = runtime.requireMock(
        __filename,
        './test_root/RegularModule.js',
      );
      expect(exports.getModuleStateValue._isMockFunction).toBe(true);
    });

    it('just falls back when loading a native module', async () => {
      const runtime = await createRuntime(__filename);
      let error;
      // Okay so this is a really WAT way to test this, but we
      // are going to require an empty .node file which should
      // throw an error letting us know that the file is too
      // short. If it does not (it gives another error) then we
      // are not correctly falling back to 'native' require.
      try {
        runtime.requireMock(__filename, './test_root/NativeModule.node');
      } catch (e) {
        error = e;
      } finally {
        expect(error.message).toMatch(
          /NativeModule.node: file too short|NativeModule.node, 0x0001|not a valid Win\d+ application/,
        );
      }
    });

    it('stores and re-uses automocked haste exports', async () => {
      const runtime = await createRuntime(__filename);
      let exports = runtime.requireMock(
        runtime.__mockRootPath,
        'RegularModule',
      );
      exports.externalMutation = 'test value';
      exports = runtime.requireMock(runtime.__mockRootPath, 'RegularModule');
      expect(exports.externalMutation).toBe('test value');
    });

    it('stores and re-uses automocked relative-path modules', async () => {
      const runtime = await createRuntime(__filename);
      let exports = runtime.requireMock(
        __filename,
        './test_root/RegularModule',
      );
      exports.externalMutation = 'test value';
      exports = runtime.requireMock(__filename, './test_root/RegularModule');
      expect(exports.externalMutation).toBe('test value');
    });

    it('multiple node core modules returns correct module', async () => {
      const runtime = await createRuntime(__filename);
      runtime.requireMock(runtime.__mockRootPath, 'fs');
      expect(
        runtime.requireMock(runtime.__mockRootPath, 'events').EventEmitter,
      ).toBeDefined();
    });

    it('throws on non-existent haste modules', async () => {
      const runtime = await createRuntime(__filename);
      expect(() => {
        runtime.requireMock(runtime.__mockRootPath, 'DoesntExist');
      }).toThrow("Cannot find module 'DoesntExist' from 'root.js'");
    });

    it('uses manual mocks when using a custom resolver', async () => {
      const runtime = await createRuntime(__filename, {
        // using the default resolver as a custom resolver
        resolver: require.resolve('./defaultResolver.js'),
      });
      const exports = runtime.requireMock(
        runtime.__mockRootPath,
        './ManuallyMocked',
      );

      expect(exports.isManualMockModule).toBe(true);
    });

    it('provides `require.main` in mock', async () => {
      const runtime = await createRuntime(__filename);
      runtime.setMock(__filename, 'export_main', () => module, {
        virtual: true,
      });
      const mainModule = runtime.requireMock(__filename, 'export_main');
      expect(mainModule).toBe(module);
    });
  });
});
