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

let createRuntime;

describe('Runtime', () => {

  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  describe('jest.mock', () => {
    pit('uses uses explicitly set mocks instead of automocking', () =>
      createRuntime(__filename).then(runtime => {
        const mockReference = {isMock: true};
        const root = runtime.requireModule(runtime.__mockRootPath, './root.js');
        // Erase module registry because root.js requires most other modules.
        root.jest.resetModuleRegistry();

        root.jest.mock('RegularModule', () => mockReference);
        root.jest.mock('ManuallyMocked', () => mockReference);

        expect(
          runtime.requireModuleOrMock(runtime.__mockRootPath, 'RegularModule')
        ).toEqual(mockReference);

        expect(
          runtime.requireModuleOrMock(runtime.__mockRootPath, 'RegularModule')
        ).toEqual(mockReference);
      })
    );
  });

  describe('jest.setMock', () => {
    pit('uses uses explicitly set mocks instead of automocking', () =>
      createRuntime(__filename).then(runtime => {
        const mockReference = {isMock: true};
        const root = runtime.requireModule(runtime.__mockRootPath, './root.js');
        // Erase module registry because root.js requires most other modules.
        root.jest.resetModuleRegistry();

        root.jest.setMock('RegularModule', mockReference);
        root.jest.setMock('ManuallyMocked', mockReference);

        expect(
          runtime.requireModuleOrMock(runtime.__mockRootPath, 'RegularModule')
        ).toBe(mockReference);

        expect(
          runtime.requireModuleOrMock(runtime.__mockRootPath, 'RegularModule')
        ).toBe(mockReference);
      })
    );
  });
});
