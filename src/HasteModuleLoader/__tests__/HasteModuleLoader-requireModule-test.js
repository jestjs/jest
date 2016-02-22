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
    name: 'HasteModuleLoader-requireModule-tests',
    rootDir,
    unmockedModulePathPatterns: ['npm3-main-dep'],
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

  describe('requireModule', function() {
    pit('finds @providesModule modules', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireModule(rootPath, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('provides `module.parent` to modules', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireModule(rootPath, 'RegularModule');
        expect(exports.parent).toEqual({
          id: 'mockParent',
          exports: {},
        });
      });
    });

    pit('throws on non-existant @providesModule modules', function() {
      return buildLoader().then(function(loader) {
        expect(function() {
          loader.requireModule(rootPath, 'DoesntExist');
        }).toThrow(
          new Error('Cannot find module \'DoesntExist\' from \'root.js\'')
        );
      });
    });

    pit('finds relative-path modules without file extension', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireModule(
          rootPath,
          './RegularModule'
        );
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('finds relative-path modules with file extension', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireModule(
          rootPath,
          './RegularModule.js'
        );
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('throws on non-existant relative-path modules', function() {
      return buildLoader().then(function(loader) {
        expect(function() {
          loader.requireModule(rootPath, './DoesntExist');
        }).toThrow(
          new Error('Cannot find module \'./DoesntExist\' from \'root.js\'')
        );
      });
    });

    pit('finds node core built-in modules', function() {
      return buildLoader().then(function(loader) {
        expect(function() {
          loader.requireModule(rootPath, 'fs');
        }).not.toThrow();
      });
    });

    pit('finds and loads JSON files without file extension', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireModule(rootPath, './JSONFile');
        expect(exports.isJSONModule).toBe(true);
      });
    });

    pit('finds and loads JSON files with file extension', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireModule(
          rootPath,
          './JSONFile.json'
        );
        expect(exports.isJSONModule).toBe(true);
      });
    });

    pit('requires a JSON file twice successfully', function() {
      return buildLoader().then(function(loader) {
        const exports1 = loader.requireModule(
          rootPath,
          './JSONFile.json'
        );
        const exports2 = loader.requireModule(
          rootPath,
          './JSONFile.json'
        );
        expect(exports1.isJSONModule).toBe(true);
        expect(exports2.isJSONModule).toBe(true);
        expect(exports1).toBe(exports2);
      });
    });

    pit('provides manual mock when real module doesnt exist', function() {
      return buildLoader().then(function(loader) {
        const exports = loader.requireModule(
          rootPath,
          'ExclusivelyManualMock'
        );
        expect(exports.isExclusivelyManualMockModule).toBe(true);
      });
    });

    pit(
      'doesnt override real modules with manual mocks when explicitly ' +
        'marked with .dontMock()',
        function() {
          return buildLoader().then(function(loader) {
            const root = loader.requireModule(rootPath, './root.js');
            root.jest.resetModuleRegistry();
            root.jest.dontMock('ManuallyMocked');
            const exports = loader.requireModule(rootPath, 'ManuallyMocked');
            expect(exports.isManualMockModule).toBe(false);
          });
        }
    );

    pit('unmocks transitive dependencies in node_modules by default', () => {
      return buildLoader().then(loader => {
        const nodeModule = loader.requireModule(rootPath, 'npm3-main-dep');
        expect(nodeModule()).toEqual({
          isMocked: false,
          transitiveNPM3Dep: 'npm3-transitive-dep',
        });
      });
    });
  });
});
