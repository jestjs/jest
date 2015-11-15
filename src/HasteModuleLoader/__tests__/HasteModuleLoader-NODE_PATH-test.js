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

var path = require('path');
var utils = require('../../lib/utils');

describe('HasteModuleLoader', function() {
  var HasteModuleLoader;
  var JSDOMEnvironment;
  var resourceMap;

  var CONFIG = utils.normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'HasteModuleLoader-NODE_PATH-tests',
    rootDir: path.resolve(__dirname, 'test_root'),
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

  function initHasteModuleLoader(nodePath) {
    process.env.NODE_PATH = nodePath;
    HasteModuleLoader = require('../HasteModuleLoader');
    JSDOMEnvironment = require('../../environments/JSDOMEnvironment');
  }

  pit('uses NODE_PATH to find modules', function() {
    var nodePath = __dirname + '/NODE_PATH_dir';
    initHasteModuleLoader(nodePath);
    return buildLoader().then(function(loader) {
      var exports = loader.requireModuleOrMock(null, 'RegularModuleInNodePath');
      expect(exports).toBeDefined();
    });
  });

  pit('finds modules in NODE_PATH containing multiple paths', function() {
    var cwd = process.cwd();
    var nodePath = cwd + '/some/other/path' + path.delimiter + __dirname +
      '/NODE_PATH_dir';
    initHasteModuleLoader(nodePath);
    return buildLoader().then(function(loader) {
      var exports = loader.requireModuleOrMock(null, 'RegularModuleInNodePath');
      expect(exports).toBeDefined();
    });
  });

  pit('doesnt find modules if NODE_PATH is relative', function() {
    var nodePath = process.cwd().substr(path.sep.length) +
      'src/HasteModuleLoader/__tests__/NODE_PATH_dir';
    initHasteModuleLoader(nodePath);
    return buildLoader().then(function(loader) {
      try {
        var exports = loader.requireModuleOrMock(
          null,
          'RegularModuleInNodePath'
        );
        expect(exports).toBeUndefined();
      } catch (e) {
        expect(
          (e.message.indexOf('Cannot find module'))
        ).toBeGreaterThan(-1);
      }
    });
  });

});
