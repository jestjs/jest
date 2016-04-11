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
    name: 'Runtime-mock-tests',
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

  describe('jest.mock', () => {
    pit('uses uses explicitly set mocks instead of automocking', () => {
      return buildLoader().then(loader => {
        const mockReference = {isMock: true};
        const root = loader.requireModule(rootPath, './root.js');
        // Erase module registry because root.js requires most other modules.
        root.jest.resetModuleRegistry();

        root.jest.mock('RegularModule', () => mockReference);
        root.jest.mock('ManuallyMocked', () => mockReference);

        expect(
          loader.requireModuleOrMock(rootPath, 'RegularModule')
        ).toEqual(mockReference);

        expect(
          loader.requireModuleOrMock(rootPath, 'RegularModule')
        ).toEqual(mockReference);
      });
    });
  });

  describe('jest.setMock', () => {
    pit('uses uses explicitly set mocks instead of automocking', () => {
      return buildLoader().then(loader => {
        const mockReference = {isMock: true};
        const root = loader.requireModule(rootPath, './root.js');
        // Erase module registry because root.js requires most other modules.
        root.jest.resetModuleRegistry();

        root.jest.setMock('RegularModule', mockReference);
        root.jest.setMock('ManuallyMocked', mockReference);

        expect(
          loader.requireModuleOrMock(rootPath, 'RegularModule')
        ).toBe(mockReference);

        expect(
          loader.requireModuleOrMock(rootPath, 'RegularModule')
        ).toBe(mockReference);
      });
    });
  });
});
