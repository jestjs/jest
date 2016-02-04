/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.autoMockOff();
jest.mock('../../environments/JSDOMEnvironment');

const path = require('path');
const utils = require('../../lib/utils');

describe('HasteModuleLoader', function() {
  let HasteModuleLoader;
  let HasteResolver;
  let JSDOMEnvironment;

  const rootDir = path.join(__dirname, 'test_root');
  const rootPath = path.join(rootDir, 'root.js');
  const config = utils.normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'HasteModuleLoader-requireMock-tests',
    rootDir,
  });

  function buildLoader() {
    const environment = new JSDOMEnvironment(config);
    const resolver = new HasteResolver(config, {resetCache: false});
    return resolver.getHasteMap().then(
      response => resolver.end().then(() =>
        new HasteModuleLoader(config, environment, response)
      )
    );
  }

  beforeEach(function() {
    HasteModuleLoader = require('../HasteModuleLoader');
    HasteResolver = require('../../resolvers/HasteResolver');
    JSDOMEnvironment = require('../../environments/JSDOMEnvironment');
  });

  describe('requireMock', function() {
    pit('uses manual mocks before attempting to automock', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireMock(rootPath, 'ManuallyMocked');
        expect(exports.isManualMockModule).toBe(true);
      });
    });

    pit('can resolve modules that are only referenced from mocks', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireMock(rootPath, 'ManuallyMocked');
        expect(
          exports.onlyRequiredFromMockModuleValue
        ).toBe('banana banana banana');
      });
    });

    pit('stores and re-uses manual mock exports', function() {
      return buildLoader().then(function(loader) {
        let exports = loader.requireMock(rootPath, 'ManuallyMocked');
        exports.setModuleStateValue('test value');
        exports = loader.requireMock(rootPath, 'ManuallyMocked');
        expect(exports.getModuleStateValue()).toBe('test value');
      });
    });

    pit('automocks @providesModule modules without a manual mock', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireMock(rootPath, 'RegularModule');
        expect(exports.getModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('automocks relative-path modules without a file extension', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireMock(
          __filename,
          './test_root/RegularModule'
        );
        expect(exports.getModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('automocks relative-path modules with a file extension', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireMock(
          __filename,
          './test_root/RegularModule.js'
        );
        expect(exports.getModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('just falls back when loading a native module', function() {
      return buildLoader().then(function(loader) {
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

    pit('stores and re-uses automocked @providesModule exports', function() {
      return buildLoader().then(function(loader) {
        let exports = loader.requireMock(rootPath, 'RegularModule');
        exports.externalMutation = 'test value';
        exports = loader.requireMock(rootPath, 'RegularModule');
        expect(exports.externalMutation).toBe('test value');
      });
    });

    pit('stores and re-uses automocked relative-path modules', function() {
      return buildLoader().then(function(loader) {
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

    pit('multiple node core modules returns correct module', function() {
      return buildLoader().then(function(loader) {
        loader.requireMock(rootPath, 'fs');
        expect(loader.requireMock(rootPath, 'events').EventEmitter).toBeDefined();
      });
    });

    pit('throws on non-existant @providesModule modules', function() {
      return buildLoader().then(function(loader) {
        expect(function() {
          loader.requireMock(rootPath, 'DoesntExist');
        }).toThrow();
      });
    });

    pit('uses the closest manual mock when duplicates exist', function() {
      return buildLoader().then(function(loader) {
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
