/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.disableAutomock();
jest.mock('jest-environment-jsdom');

const path = require('path');
const normalizeConfig = require('../../config/normalize');

describe('Runtime', () => {
  let Runtime;
  let HasteResolver;
  let JSDOMEnvironment;

  const rootDir = path.join(__dirname, 'test_root');
  const rootPath = path.join(rootDir, 'root.js');
  const config = normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'Runtime-requireMock-tests',
    rootDir,
  });

  function buildLoader() {
    const environment = new JSDOMEnvironment(config);
    const resolver = new HasteResolver(config, {resetCache: false});
    return resolver.getHasteMap().then(
      response => resolver.end().then(() =>
        new Runtime(config, environment, response)
      )
    );
  }

  beforeEach(() => {
    Runtime = require('../Runtime');
    HasteResolver = require('../../resolvers/HasteResolver');
    JSDOMEnvironment = require('jest-environment-jsdom');
  });

  describe('requireMock', () => {
    pit('uses manual mocks before attempting to automock', () => {
      return buildLoader().then(loader => {
        const exports = loader.requireMock(rootPath, 'ManuallyMocked');
        expect(exports.isManualMockModule).toBe(true);
      });
    });

    pit('can resolve modules that are only referenced from mocks', () => {
      return buildLoader().then(loader => {
        const exports = loader.requireMock(rootPath, 'ManuallyMocked');
        expect(
          exports.onlyRequiredFromMockModuleValue
        ).toBe('banana banana banana');
      });
    });

    pit('stores and re-uses manual mock exports', () => {
      return buildLoader().then(loader => {
        let exports = loader.requireMock(rootPath, 'ManuallyMocked');
        exports.setModuleStateValue('test value');
        exports = loader.requireMock(rootPath, 'ManuallyMocked');
        expect(exports.getModuleStateValue()).toBe('test value');
      });
    });

    pit('automocks @providesModule modules without a manual mock', () => {
      return buildLoader().then(loader => {
        const exports = loader.requireMock(rootPath, 'RegularModule');
        expect(exports.getModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('automocks relative-path modules without a file extension', () => {
      return buildLoader().then(loader => {
        const exports = loader.requireMock(
          __filename,
          './test_root/RegularModule'
        );
        expect(exports.getModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('automocks relative-path modules with a file extension', () => {
      return buildLoader().then(loader => {
        const exports = loader.requireMock(
          __filename,
          './test_root/RegularModule.js'
        );
        expect(exports.getModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('just falls back when loading a native module', () => {
      return buildLoader().then(loader => {
        let error;
        // Okay so this is a really WAT way to test this, but we
        // are going to require an empty .node file which should
        // throw an error letting us know that the file is too
        // short. If it does not (it gives another error) then we
        // are not correctly falling back to 'native' require.
        try {
          loader.requireMock(
            __filename,
            './test_root/NativeModule.node'
          );
        } catch (e) {
          error = e;
        } finally {
          expect(error.message).toMatch(
            /NativeModule.node\: file too short|not a valid Win\d+ application/
          );
        }
      });
    });

    pit('stores and re-uses automocked @providesModule exports', () => {
      return buildLoader().then(loader => {
        let exports = loader.requireMock(rootPath, 'RegularModule');
        exports.externalMutation = 'test value';
        exports = loader.requireMock(rootPath, 'RegularModule');
        expect(exports.externalMutation).toBe('test value');
      });
    });

    pit('stores and re-uses automocked relative-path modules', () => {
      return buildLoader().then(loader => {
        let exports = loader.requireMock(
          __filename,
          './test_root/RegularModule'
        );
        exports.externalMutation = 'test value';
        exports = loader.requireMock(
          __filename,
          './test_root/RegularModule'
        );
        expect(exports.externalMutation).toBe('test value');
      });
    });

    pit('multiple node core modules returns correct module', () => {
      return buildLoader().then(loader => {
        loader.requireMock(rootPath, 'fs');
        expect(loader.requireMock(rootPath, 'events').EventEmitter).toBeDefined();
      });
    });

    pit('throws on non-existent @providesModule modules', () => {
      return buildLoader().then(loader => {
        expect(() => {
          loader.requireMock(rootPath, 'DoesntExist');
        }).toThrow();
      });
    });

    pit('uses the closest manual mock when duplicates exist', () => {
      return buildLoader().then(loader => {
        const exports1 = loader.requireMock(
          __dirname,
          path.resolve(__dirname, './test_root/subdir1/MyModule')
        );
        expect(exports1.modulePath).toEqual(
          'subdir1/__mocks__/MyModule.js'
        );

        const exports2 = loader.requireMock(
          __dirname,
          path.resolve(__dirname, './test_root/subdir2/MyModule')
        );
        expect(exports2.modulePath).toEqual(
          'subdir2/__mocks__/MyModule.js'
        );
      });
    });
  });
});
