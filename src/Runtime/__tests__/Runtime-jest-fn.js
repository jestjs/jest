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
    name: 'Runtime-jest-fn-tests',
    rootDir,
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

  beforeEach(() => {
    Runtime = require('../Runtime');
    HasteResolver = require('../../resolvers/HasteResolver');
    JSDOMEnvironment = require('jest-environment-jsdom');
  });

  describe('jest.fn', () => {
    pit('creates mock functions', () => {
      return buildLoader().then(loader => {
        const root = loader.requireModule(null, rootPath);
        const mock = root.jest.fn();
        expect(mock._isMockFunction).toBe(true);
        mock();
        expect(mock).toBeCalled();
      });
    });

    pit('creates mock functions with mock implementations', () => {
      return buildLoader().then(loader => {
        const root = loader.requireModule(null, rootPath);
        const mock = root.jest.fn(string => string + ' implementation');
        expect(mock._isMockFunction).toBe(true);
        const value = mock('mock');
        expect(value).toEqual('mock implementation');
        expect(mock).toBeCalled();
      });
    });
  });
});
