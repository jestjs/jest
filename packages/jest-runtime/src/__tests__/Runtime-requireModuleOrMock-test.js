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
jest.mock(
  'jest-environment-jsdom',
  () => require('../__mocks__/jest-environment-jsdom')
);

let createRuntime;

describe('Runtime', () => {
  const moduleNameMapper = {
    '^image![a-zA-Z0-9$_-]+$': 'GlobalImageStub',
    '^[./a-zA-Z0-9$_-]+\.png$': 'RelativeImageStub',
    'mappedToPath': '<rootDir>/GlobalImageStub.js',
    'mappedToDirectory': '<rootDir>/MyDirectoryModule',
    'module/name/(.*)': '<rootDir>/mapped_module_$1.js',
  };

  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  describe('requireModuleOrMock', () => {
    it('mocks modules by default', () =>
      createRuntime(__filename, {moduleNameMapper}).then(runtime => {
        const exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'RegularModule'
        );
        expect(exports.setModuleStateValue._isMockFunction).toBe(true);
      })
    );

    it(`doesn't mock modules when explicitly unmocked`, () =>
      createRuntime(__filename, {moduleNameMapper}).then(runtime => {
        const root = runtime.requireModule(runtime.__mockRootPath);
        root.jest.unmock('RegularModule');
        const exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'RegularModule'
        );
        expect(exports.isRealModule).toBe(true);
      })
    );

    it(`doesn't mock modules when explicitly unmocked via a different denormalized module name`, () =>
      createRuntime(__filename, {moduleNameMapper}).then(runtime => {
        const root = runtime.requireModule(runtime.__mockRootPath);
        root.jest.unmock('./RegularModule');
        const exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'RegularModule'
        );
        expect(exports.isRealModule).toBe(true);
      })
    );

    it(`doesn't mock modules when disableAutomock() has been called`, () =>
      createRuntime(__filename, {moduleNameMapper}).then(runtime => {
        const root = runtime.requireModule(runtime.__mockRootPath);
        root.jest.disableAutomock();
        const exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'RegularModule'
        );
        expect(exports.isRealModule).toBe(true);
      })
    );

    it('uses manual mock when automocking on and mock is avail', () =>
      createRuntime(__filename, {moduleNameMapper}).then(runtime => {
        const exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'ManuallyMocked'
        );
        expect(exports.isManualMockModule).toBe(true);
      })
    );

    it('does not use manual mock when automocking is off and a real module is available', () =>
      createRuntime(__filename, {moduleNameMapper}).then(runtime => {
        const root = runtime.requireModule(runtime.__mockRootPath);
        root.jest.disableAutomock();
        const exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'ManuallyMocked'
        );
        expect(exports.isManualMockModule).toBe(false);
      })
    );

    it('resolves mapped module names and unmocks them by default', () =>
      createRuntime(__filename, {moduleNameMapper}).then(runtime => {
        let exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'image!not-really-a-module'
        );
        expect(exports.isGlobalImageStub).toBe(true);

        exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'mappedToPath'
        );
        expect(exports.isGlobalImageStub).toBe(true);

        exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'mappedToDirectory'
        );
        expect(exports.isIndex).toBe(true);

        exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'cat.png'
        );
        expect(exports.isRelativeImageStub).toBe(true);

        exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          '../photos/dog.png'
        );
        expect(exports.isRelativeImageStub).toBe(true);

        exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'module/name/test'
        );
        expect(exports).toBe('mapped_module');
      })
    );

    it('automocking be disabled by default', () =>
      createRuntime(__filename, {
        moduleNameMapper,
        automock: false,
      }).then(runtime => {
        const exports = runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'RegularModule'
        );
        expect(exports.setModuleStateValue._isMockFunction).toBe(undefined);
      })
    );

    describe('transitive dependencies', () => {
      const expectUnmocked = nodeModule => {
        const moduleData = nodeModule();
        expect(moduleData.isUnmocked()).toBe(true);
        expect(moduleData.transitiveNPM3Dep).toEqual('npm3-transitive-dep');
        expect(moduleData.internalImplementation())
          .toEqual('internal-module-code');
      };

      it('unmocks transitive dependencies in node_modules by default', () =>
        createRuntime(__filename, {
          moduleNameMapper,
          unmockedModulePathPatterns: ['npm3-main-dep'],
        }).then(runtime => {
          const root = runtime.requireModule(
            runtime.__mockRootPath,
            './root.js'
          );
          expectUnmocked(runtime.requireModuleOrMock(
            runtime.__mockRootPath,
            'npm3-main-dep'
          ));

          // Test twice to make sure Runtime caching works properly
          root.jest.resetModuleRegistry();
          expectUnmocked(runtime.requireModuleOrMock(
            runtime.__mockRootPath,
            'npm3-main-dep')
          );

          // Directly requiring the transitive dependency will mock it
          const transitiveDep = runtime.requireModuleOrMock(
            runtime.__mockRootPath,
            'npm3-transitive-dep'
          );
          expect(transitiveDep()).toEqual(undefined);
        })
      );

      it('unmocks transitive dependencies in node_modules when using unmock', () =>
        createRuntime(__filename, {moduleNameMapper}).then(runtime => {
          const root = runtime.requireModule(runtime.__mockRootPath);
          root.jest.unmock('npm3-main-dep');
          expectUnmocked(runtime.requireModuleOrMock(
            runtime.__mockRootPath,
            'npm3-main-dep'
          ));

          // Test twice to make sure Runtime caching works properly
          root.jest.resetModuleRegistry();
          expectUnmocked(runtime.requireModuleOrMock(
            runtime.__mockRootPath,
            'npm3-main-dep'
          ));

          // Directly requiring the transitive dependency will mock it
          const transitiveDep = runtime.requireModuleOrMock(
            runtime.__mockRootPath,
            'npm3-transitive-dep'
          );
          expect(transitiveDep()).toEqual(undefined);
        })
      );

      it('unmocks transitive dependencies in node_modules by default when using both patterns and unmock', () =>
        createRuntime(__filename, {
          moduleNameMapper,
          unmockedModulePathPatterns: ['banana-module'],
        }).then(runtime => {
          const root = runtime.requireModule(runtime.__mockRootPath);
          root.jest.unmock('npm3-main-dep');
          expectUnmocked(runtime.requireModuleOrMock(
            runtime.__mockRootPath,
            'npm3-main-dep'
          ));

          // Test twice to make sure Runtime caching works properly
          root.jest.resetModuleRegistry();
          expectUnmocked(runtime.requireModuleOrMock(
            runtime.__mockRootPath,
            'npm3-main-dep'
          ));

          // Directly requiring the transitive dependency will mock it
          const transitiveDep = runtime.requireModuleOrMock(
            runtime.__mockRootPath,
            'npm3-transitive-dep'
          );
          expect(transitiveDep()).toEqual(undefined);
        })
      );
    });
  });
});
