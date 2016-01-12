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

var path = require('path');
var utils = require('../../lib/utils');

describe('HasteModuleLoader', function() {
  var HasteModuleLoader;
  var JSDOMEnvironment;
  var resourceMap;

  var CONFIG = utils.normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'HasteModuleLoader-jsdom-env-tests',
    rootDir: path.join(__dirname, 'test_root'),
  });

  function buildLoader() {
    if (!resourceMap) {
      return HasteModuleLoader.loadResourceMap(CONFIG).then(function(map) {
        resourceMap = map;
        return buildLoader();
      });
    } else {
      var mockEnvironment = new JSDOMEnvironment(CONFIG);
      return Promise.resolve(
        new HasteModuleLoader(CONFIG, mockEnvironment, resourceMap)
      );
    }
  }

  beforeEach(function() {
    HasteModuleLoader = require('../HasteModuleLoader');
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
