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
    name: 'HasteModuleLoader-NODE_PATH-tests',
    rootDir: path.resolve(__dirname, 'test_root'),
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

  function initHasteModuleLoader(nodePath) {
    process.env.NODE_PATH = nodePath;
    HasteModuleLoader = require('../HasteModuleLoader');
    HasteResolver = require('../../resolvers/HasteResolver');
    JSDOMEnvironment = require('../../environments/JSDOMEnvironment');
  }

  pit('uses NODE_PATH to find modules', function() {
    const nodePath = __dirname + '/NODE_PATH_dir';
    initHasteModuleLoader(nodePath);
    return buildLoader().then(function(loader) {
      const exports =
        loader.requireModuleOrMock(rootPath, 'RegularModuleInNodePath');
      expect(exports).toBeDefined();
    });
  });

  pit('finds modules in NODE_PATH containing multiple paths', function() {
    const cwd = process.cwd();
    const nodePath = cwd + '/some/other/path' + path.delimiter + __dirname +
      '/NODE_PATH_dir';
    initHasteModuleLoader(nodePath);
    return buildLoader().then(function(loader) {
      const exports =
        loader.requireModuleOrMock(rootPath, 'RegularModuleInNodePath');
      expect(exports).toBeDefined();
    });
  });

  pit('doesnt find modules if NODE_PATH is relative', function() {
    const nodePath = process.cwd().substr(path.sep.length) +
      'src/HasteModuleLoader/__tests__/NODE_PATH_dir';
    initHasteModuleLoader(nodePath);
    return buildLoader().then(function(loader) {
      expect(() => {
        loader.requireModuleOrMock(
          rootPath,
          'RegularModuleInNodePath'
        );
      }).toThrow(
        new Error(`Cannot find module 'RegularModuleInNodePath' from 'root.js'`)
      );
    });
  });

});
