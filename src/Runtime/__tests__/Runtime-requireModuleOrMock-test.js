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
  let createHasteMap;
  let JSDOMEnvironment;

  const rootDir = path.join(__dirname, 'test_root');
  const rootPath = path.join(rootDir, 'root.js');
  const baseConfig = normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'Runtime-requireModuleOrMock-tests',
    rootDir,
    moduleNameMapper: {
      '^image![a-zA-Z0-9$_-]+$': 'GlobalImageStub',
      '^[./a-zA-Z0-9$_-]+\.png$': 'RelativeImageStub',
      'mappedToPath': '<rootDir>/GlobalImageStub.js',
      'module/name/(.*)': '<rootDir>/mapped_module_$1.js',
    },
  });

  function buildLoader(config) {
    config = Object.assign({}, baseConfig, config);
    const environment = new JSDOMEnvironment(config);
    return createHasteMap(config, {resetCache: false, maxWorkers: 1})
      .build()
      .then(response => new Runtime(config, environment, response));
  }

  beforeEach(() => {
    Runtime = require('../Runtime');
    createHasteMap = require('../../lib/createHasteMap');
    JSDOMEnvironment = require('jest-environment-jsdom');
  });

  describe('requireModuleOrMock', () => {
    pit('mocks modules by default', () => {
      return buildLoader().then(loader => {
        const exports = loader.requireModuleOrMock(rootPath, 'RegularModule');
        expect(exports.setModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit(`doesn't mock modules when explicitly unmocked`, () => {
      return buildLoader().then(loader => {
        const root = loader.requireModule(rootDir, rootPath);
        root.jest.unmock('RegularModule');
        const exports = loader.requireModuleOrMock(rootPath, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit(`doesn't mock modules when explicitly unmocked via a different denormalized module name`, () => {
      return buildLoader().then(loader => {
        const root = loader.requireModule(rootDir, rootPath);
        root.jest.unmock('./RegularModule');
        const exports = loader.requireModuleOrMock(rootPath, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit(`doesn't mock modules when disableAutomock() has been called`, () => {
      return buildLoader().then(loader => {
        const root = loader.requireModule(rootDir, rootPath);
        root.jest.disableAutomock();
        const exports = loader.requireModuleOrMock(rootPath, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('uses manual mock when automocking on and mock is avail', () => {
      return buildLoader().then(loader => {
        const exports = loader.requireModuleOrMock(rootPath, 'ManuallyMocked');
        expect(exports.isManualMockModule).toBe(true);
      });
    });

    pit(
      'does not use manual mock when automocking is off and a real module is ' +
      'available',
      () => {
        return buildLoader().then(loader => {
          const root = loader.requireModule(rootDir, rootPath);
          root.jest.disableAutomock();
          const exports = loader.requireModuleOrMock(
            rootPath,
            'ManuallyMocked'
          );
          expect(exports.isManualMockModule).toBe(false);
        });
      }
    );

    pit('resolves mapped module names and unmocks them by default', () => {
      return buildLoader().then(loader => {
        let exports =
          loader.requireModuleOrMock(rootPath, 'image!not-really-a-module');
        expect(exports.isGlobalImageStub).toBe(true);

        exports = loader.requireModuleOrMock(rootPath, 'mappedToPath');
        expect(exports.isGlobalImageStub).toBe(true);

        exports = loader.requireModuleOrMock(rootPath, 'cat.png');
        expect(exports.isRelativeImageStub).toBe(true);

        exports = loader.requireModuleOrMock(rootPath, '../photos/dog.png');
        expect(exports.isRelativeImageStub).toBe(true);

        exports = loader.requireModuleOrMock(rootPath, 'module/name/test');
        expect(exports).toBe('mapped_module');
      });
    });

    describe('automocking behavior', () => {
      it('can be disabled by default', () => {
        return buildLoader({
          automock: false,
        }).then(loader => {
          const exports = loader.requireModuleOrMock(rootPath, 'RegularModule');
          expect(exports.setModuleStateValue._isMockFunction).toBe(undefined);
        });
      });
    });

    describe('transitive dependencies', () => {
      const expectUnmocked = nodeModule => {
        const moduleData = nodeModule();
        expect(moduleData.isUnmocked()).toBe(true);
        expect(moduleData.transitiveNPM3Dep).toEqual('npm3-transitive-dep');
        expect(moduleData.internalImplementation())
          .toEqual('internal-module-code');
      };

      pit('unmocks transitive dependencies in node_modules by default', () => {
        return buildLoader({
          unmockedModulePathPatterns: ['npm3-main-dep'],
        }).then(loader => {
          const root = loader.requireModule(rootPath, './root.js');
          expectUnmocked(loader.requireModuleOrMock(rootPath, 'npm3-main-dep'));

          // Test twice to make sure HasteModuleLoader caching works properly
          root.jest.resetModuleRegistry();
          expectUnmocked(loader.requireModuleOrMock(rootPath, 'npm3-main-dep'));

          // Directly requiring the transitive dependency will mock it
          const transitiveDep =
            loader.requireModuleOrMock(rootPath, 'npm3-transitive-dep');
          expect(transitiveDep()).toEqual(undefined);
        });
      });

      pit('unmocks transitive dependencies in node_modules when using unmock', () => {
        return buildLoader().then(loader => {
          const root = loader.requireModule(rootPath, './root.js');
          root.jest.unmock('npm3-main-dep');
          expectUnmocked(loader.requireModuleOrMock(rootPath, 'npm3-main-dep'));

          // Test twice to make sure HasteModuleLoader caching works properly
          root.jest.resetModuleRegistry();
          expectUnmocked(loader.requireModuleOrMock(rootPath, 'npm3-main-dep'));

          // Directly requiring the transitive dependency will mock it
          const transitiveDep =
            loader.requireModuleOrMock(rootPath, 'npm3-transitive-dep');
          expect(transitiveDep()).toEqual(undefined);
        });
      });

      pit('unmocks transitive dependencies in node_modules by default when using both patterns and unmock', () => {
        return buildLoader({
          unmockedModulePathPatterns: ['banana-module'],
        }).then(loader => {
          const root = loader.requireModule(rootPath, './root.js');
          root.jest.unmock('npm3-main-dep');
          expectUnmocked(loader.requireModuleOrMock(rootPath, 'npm3-main-dep'));

          // Test twice to make sure HasteModuleLoader caching works properly
          root.jest.resetModuleRegistry();
          expectUnmocked(loader.requireModuleOrMock(rootPath, 'npm3-main-dep'));

          // Directly requiring the transitive dependency will mock it
          const transitiveDep =
            loader.requireModuleOrMock(rootPath, 'npm3-transitive-dep');
          expect(transitiveDep()).toEqual(undefined);
        });
      });
    });
  });
});
