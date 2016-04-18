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
  let createHasteMap;
  let JSDOMEnvironment;

  const rootDir = path.join(__dirname, 'test_root');
  const rootPath = path.join(rootDir, 'root.js');
  const baseConfig = normalizeConfig({
    cacheDirectory: global.CACHE_DIRECTORY,
    name: 'Runtime-getTestEnvData-tests',
    rootDir,
    testEnvData: {someTestData: 42},
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

  pit('passes config data through to jest.envData', () => {
    return buildLoader().then(loader => {
      const root = loader.requireModule(rootDir, rootPath);
      const envData = root.jest.getTestEnvData();
      expect(envData).toEqual(baseConfig.testEnvData);
    });
  });

  pit('freezes jest.envData object', () => {
    return buildLoader().then(loader => {
      const root = loader.requireModule(rootDir, rootPath);
      const envData = root.jest.getTestEnvData();
      expect(Object.isFrozen(envData)).toBe(true);
    });
  });
});
