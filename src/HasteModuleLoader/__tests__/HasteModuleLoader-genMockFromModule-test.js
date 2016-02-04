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

describe('nodeHasteModuleLoader', function() {
  let HasteModuleLoader;
  let HasteResolver;
  let JSDOMEnvironment;

  const rootDir = path.resolve(__dirname, 'test_root');
  const rootPath = path.resolve(rootDir, 'root.js');
  const config = utils.normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'nodeHasteModuleLoader-genMockFromModule-tests',
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

  describe('genMockFromModule', function() {
    pit(
      'does not cause side effects in the rest of the module system when ' +
      'generating a mock',
      function() {
        return buildLoader().then(loader => {
          const testRequire = loader.requireModule.bind(loader, rootPath);

          const regularModule = testRequire('RegularModule');
          const origModuleStateValue = regularModule.getModuleStateValue();

          expect(origModuleStateValue).toBe('default');

          // Generate a mock for a module with side effects
          const mock = regularModule.jest.genMockFromModule('ModuleWithSideEffects');

          // Make sure we get a mock.
          expect(mock.fn()).toBe(undefined);

          expect(regularModule.getModuleStateValue()).toBe(
            origModuleStateValue
          );
        });
      }
    );
  });
});
