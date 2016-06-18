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
  () => require('../__mocks__/jest-environment-jsdom')
);

const config = {
  testEnvData: {
    someTestData: 42,
  },
};

let createRuntime;

describe('Runtime', () => {

  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  it('passes config data through to jest.envData', () =>
    createRuntime(__filename, config).then(runtime => {
      const root = runtime.requireModule(runtime.__mockRootPath);
      const envData = root.jest.getTestEnvData();
      expect(envData).toEqual(config.testEnvData);
    })
  );

  it('freezes jest.envData object', () =>
    createRuntime(__filename, config).then(runtime => {
      const root = runtime.requireModule(runtime.__mockRootPath);
      const envData = root.jest.getTestEnvData();
      expect(Object.isFrozen(envData)).toBe(true);
    })
  );
});
