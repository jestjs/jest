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
jest.mock(
  'jest-environment-jsdom',
  () => require('../../../__mocks__/jest-environment-jsdom')
);

const path = require('path');
const normalizeConfig = require('../../config/normalize');

describe('nodeRuntime', () => {
  let Runtime;
  let createHasteMap;
  let JSDOMEnvironment;

  const rootDir = path.resolve(__dirname, 'test_root');
  const rootPath = path.resolve(rootDir, 'root.js');
  const baseConfig = normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'nodeRuntime-genMockFromModule-tests',
    rootDir,
  });

  function buildLoader(config) {
    config = Object.assign({}, baseConfig, config);
    const environment = new JSDOMEnvironment(config);
    return createHasteMap(config, {resetCache: false, maxWorkers: 1})
      .build()
      .then(response => new Runtime(config, environment, response));
  }

  beforeEach(() => {
    Runtime = require('../Runtime');
    createHasteMap = require('../../lib/createHasteMap');
    JSDOMEnvironment = require('jest-environment-jsdom');
  });

  describe('genMockFromModule', () => {
    pit(
      'does not cause side effects in the rest of the module system when ' +
      'generating a mock',
      () => {
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
