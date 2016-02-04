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
    name: 'HasteModuleLoader-requireModuleOrMock-tests',
    rootDir,
    moduleNameMapper: {
      '^image![a-zA-Z0-9$_-]+$': 'GlobalImageStub',
      '^[./a-zA-Z0-9$_-]+\.png$': 'RelativeImageStub',
    },
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

  describe('requireModuleOrMock', function() {
    pit('mocks modules by default', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireModuleOrMock(rootPath, 'RegularModule');
        expect(exports.setModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('doesnt mock modules when explicitly dontMock()ed', function() {
      return buildLoader().then(function(loader) {
        const root = loader.requireModule(rootDir, rootPath);
        root.jest.dontMock('RegularModule');
        const exports = loader.requireModuleOrMock(rootPath, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit(
      'doesnt mock modules when explicitly dontMock()ed via a different ' +
      'denormalized module name',
      function() {
        return buildLoader().then(function(loader) {
          const root = loader.requireModule(rootDir, rootPath);
          root.jest.dontMock('./RegularModule');
          const exports = loader.requireModuleOrMock(rootPath, 'RegularModule');
          expect(exports.isRealModule).toBe(true);
        });
      }
    );

    pit('doesnt mock modules when autoMockOff() has been called', function() {
      return buildLoader().then(function(loader) {
        const root = loader.requireModule(rootDir, rootPath);
        root.jest.autoMockOff();
        const exports = loader.requireModuleOrMock(rootPath, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('uses manual mock when automocking on and mock is avail', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireModuleOrMock(rootPath, 'ManuallyMocked');
        expect(exports.isManualMockModule).toBe(true);
      });
    });

    pit(
      'does not use manual mock when automocking is off and a real module is ' +
      'available',
      function() {
        return buildLoader().then(function(loader) {
          const root = loader.requireModule(rootDir, rootPath);
          root.jest.autoMockOff();
          const exports = loader.requireModuleOrMock(
            rootPath,
            'ManuallyMocked'
          );
          expect(exports.isManualMockModule).toBe(false);
        });
      }
    );

    pit('resolves mapped module names and unmocks them by default', function() {
      return buildLoader().then(function(loader) {
        let exports =
          loader.requireModuleOrMock(rootPath, 'image!not-really-a-module');
        expect(exports.isGlobalImageStub).toBe(true);

        exports = loader.requireModuleOrMock(rootPath, 'cat.png');
        expect(exports.isRelativeImageStub).toBe(true);

        exports = loader.requireModuleOrMock(rootPath, 'dog.png');
        expect(exports.isRelativeImageStub).toBe(true);
      });
    });
  });
});
