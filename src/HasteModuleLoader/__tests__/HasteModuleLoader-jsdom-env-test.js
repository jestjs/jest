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

const path = require('path');
const utils = require('../../lib/utils');

describe('HasteModuleLoader', function() {
  let HasteModuleLoader;
  let HasteResolver;
  let JSDOMEnvironment;

  const rootDir = path.join(__dirname, 'test_root');
  const config = utils.normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'HasteModuleLoader-jsdom-env-tests',
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

  describe('requireModule', function() {
    pit('emulates a node stack trace during module load', function() {
      return buildLoader().then(function(loader) {
        let hasThrown = false;
        try {
          loader.requireModule(
            __filename,
            './test_root/throwing.js'
          );
        } catch (err) {
          hasThrown = true;
          expect(err.stack).toMatch(/^Error: throwing\s+at Object.<anonymous>/);
        }
        expect(hasThrown).toBe(true);
      });
    });

    pit('emulates a node stack trace during function execution', function() {
      return buildLoader().then(function(loader) {
        let hasThrown = false;
        const sum = loader.requireModule(
          __filename,
          './test_root/throwing-fn.js'
        );

        try {
          sum();
        } catch (err) {
          hasThrown = true;
          expect(err.stack).toMatch(/^Error: throwing fn\s+at sum.+HasteModuleLoader\/__tests__\/test_root\/throwing-fn.js:12:9/);
        }
        expect(hasThrown).toBe(true);
      });
    });
  });
});
