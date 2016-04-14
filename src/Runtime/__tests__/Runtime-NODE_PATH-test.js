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
  let HasteResolver;
  let JSDOMEnvironment;

  const rootDir = path.join(__dirname, 'test_root');
  const rootPath = path.join(rootDir, 'root.js');
  const config = normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'Runtime-NODE_PATH-tests',
    rootDir: path.resolve(__dirname, 'test_root'),
  });

  function buildLoader() {
    const environment = new JSDOMEnvironment(config);
    const resolver = new HasteResolver(config, {resetCache: false});
    return resolver.getHasteMap().then(
      response => resolver.end().then(() =>
        new Runtime(config, environment, response)
      )
    );
  }

  function initHasteModuleLoader(nodePath) {
    process.env.NODE_PATH = nodePath;
    Runtime = require('../Runtime');
    HasteResolver = require('../../resolvers/HasteResolver');
    JSDOMEnvironment = require('jest-environment-jsdom');
  }

  pit('uses NODE_PATH to find modules', () => {
    const nodePath = __dirname + '/NODE_PATH_dir';
    initHasteModuleLoader(nodePath);
    return buildLoader().then(loader => {
      const exports =
        loader.requireModuleOrMock(rootPath, 'RegularModuleInNodePath');
      expect(exports).toBeDefined();
    });
  });

  pit('finds modules in NODE_PATH containing multiple paths', () => {
    const cwd = process.cwd();
    const nodePath = cwd + '/some/other/path' + path.delimiter + __dirname +
      '/NODE_PATH_dir';
    initHasteModuleLoader(nodePath);
    return buildLoader().then(loader => {
      const exports =
        loader.requireModuleOrMock(rootPath, 'RegularModuleInNodePath');
      expect(exports).toBeDefined();
    });
  });

  pit('doesnt find modules if NODE_PATH is relative', () => {
    const nodePath = process.cwd().substr(path.sep.length) +
      'src/Runtime/__tests__/NODE_PATH_dir';
    initHasteModuleLoader(nodePath);
    return buildLoader().then(loader => {
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
