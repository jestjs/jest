/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const path = require('path');

let createRuntime;

const rootJsPath = path.join('.', path.sep, 'root');

describe('Runtime', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  describe('jest.mock', () => {
    it('uses explicitly set mocks instead of automocking', async () => {
      const runtime = await createRuntime(__filename);
      const mockReference = {isMock: true};
      const root = runtime.requireModule(runtime.__mockRootPath, rootJsPath);
      // Erase module registry because root.js requires most other modules.
      root.jest.resetModules();

      root.jest.mock('RegularModule', () => mockReference);
      root.jest.mock('ManuallyMocked', () => mockReference);
      root.jest.mock('nested1/nested2/nested3');

      expect(
        runtime.requireModuleOrMock(runtime.__mockRootPath, 'RegularModule'),
      ).toEqual(mockReference);

      expect(
        runtime.requireModuleOrMock(runtime.__mockRootPath, 'ManuallyMocked'),
      ).toEqual(mockReference);

      expect(
        runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'nested1/nested2/nested3',
        ),
      ).toEqual(mockReference);
    });

    it('sets virtual mock for non-existing module required from same directory', async () => {
      const runtime = await createRuntime(__filename);
      const mockReference = {isVirtualMock: true};
      const virtual = true;
      const root = runtime.requireModule(runtime.__mockRootPath, rootJsPath);
      // Erase module registry because root.js requires most other modules.
      root.jest.resetModules();

      root.jest.mock('NotInstalledModule', () => mockReference, {virtual});
      root.jest.mock('../ManuallyMocked', () => mockReference, {virtual});
      root.jest.mock('/AbsolutePath/Mock', () => mockReference, {virtual});

      expect(
        runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          'NotInstalledModule',
        ),
      ).toEqual(mockReference);

      expect(
        runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          '../ManuallyMocked',
        ),
      ).toEqual(mockReference);

      expect(
        runtime.requireModuleOrMock(
          runtime.__mockRootPath,
          '/AbsolutePath/Mock',
        ),
      ).toEqual(mockReference);
    });

    it('sets virtual mock for non-existing module required from different directory', async () => {
      const runtime = await createRuntime(__filename);
      const mockReference = {isVirtualMock: true};
      const virtual = true;
      const root = runtime.requireModule(runtime.__mockRootPath, rootJsPath);
      // Erase module registry because root.js requires most other modules.
      root.jest.resetModules();

      root.jest.mock('NotInstalledModule', () => mockReference, {virtual});
      root.jest.mock('../ManuallyMocked', () => mockReference, {virtual});
      root.jest.mock('/AbsolutePath/Mock', () => mockReference, {virtual});

      expect(
        runtime.requireModuleOrMock(
          runtime.__mockSubdirPath,
          'NotInstalledModule',
        ),
      ).toEqual(mockReference);

      expect(
        runtime.requireModuleOrMock(
          runtime.__mockSubdirPath,
          '../../../ManuallyMocked',
        ),
      ).toEqual(mockReference);

      expect(
        runtime.requireModuleOrMock(
          runtime.__mockSubdirPath,
          '/AbsolutePath/Mock',
        ),
      ).toEqual(mockReference);
    });
  });

  describe('jest.setMock', () => {
    it('uses explicitly set mocks instead of automocking', async () => {
      const runtime = await createRuntime(__filename);
      const mockReference = {isMock: true};
      const root = runtime.requireModule(runtime.__mockRootPath, rootJsPath);
      // Erase module registry because root.js requires most other modules.
      root.jest.resetModules();

      root.jest.setMock('RegularModule', mockReference);
      root.jest.setMock('ManuallyMocked', mockReference);

      expect(
        runtime.requireModuleOrMock(runtime.__mockRootPath, 'RegularModule'),
      ).toBe(mockReference);

      expect(
        runtime.requireModuleOrMock(runtime.__mockRootPath, 'ManuallyMocked'),
      ).toBe(mockReference);
    });
  });

  describe('jest.onGenerateMock', () => {
    it('calls single callback and returns transformed value', async () => {
      const runtime = await createRuntime(__filename);
      const mockReference = {isMock: true};
      const root = runtime.requireModule(runtime.__mockRootPath, rootJsPath);
      // Erase module registry because root.js requires most other modules.
      root.jest.resetModules();

      const onGenerateMock = jest.fn((moduleName, moduleMock) => mockReference);

      root.jest.onGenerateMock(onGenerateMock);
      root.jest.mock('RegularModule');
      root.jest.mock('ManuallyMocked');

      expect(
        runtime.requireModuleOrMock(runtime.__mockRootPath, 'RegularModule'),
      ).toEqual(mockReference);
      expect(onGenerateMock).toHaveBeenCalledWith(
        expect.stringMatching(/[/\\]test_root[/\\]RegularModule\.js$/),
        expect.anything(),
      );

      onGenerateMock.mockReset();

      expect(
        runtime.requireModuleOrMock(runtime.__mockRootPath, 'ManuallyMocked'),
      ).not.toEqual(mockReference);
      expect(onGenerateMock).not.toHaveBeenCalled();
    });

    it('calls multiple callback and returns transformed value', async () => {
      const runtime = await createRuntime(__filename);
      const root = runtime.requireModule(runtime.__mockRootPath, rootJsPath);
      // Erase module registry because root.js requires most other modules.
      root.jest.resetModules();

      const onGenerateMock1 = jest.fn((moduleName, moduleMock) => ({
        isMock: true,
        value: 1,
      }));

      const onGenerateMock2 = jest.fn((moduleName, moduleMock) => ({
        ...moduleMock,
        value: moduleMock.value + 1,
      }));

      const onGenerateMock3 = jest.fn((moduleName, moduleMock) => ({
        ...moduleMock,
        value: moduleMock.value ** 2,
      }));

      root.jest.onGenerateMock(onGenerateMock1);
      root.jest.onGenerateMock(onGenerateMock2);
      root.jest.onGenerateMock(onGenerateMock3);
      root.jest.mock('RegularModule');
      root.jest.mock('ManuallyMocked');

      expect(
        runtime.requireModuleOrMock(runtime.__mockRootPath, 'RegularModule'),
      ).toEqual({
        isMock: true,
        value: 4,
      });
      expect(onGenerateMock1).toHaveBeenCalledWith(
        expect.stringMatching(/[/\\]test_root[/\\]RegularModule\.js$/),
        expect.anything(),
      );
      expect(onGenerateMock2).toHaveBeenCalledWith(
        expect.stringMatching(/[/\\]test_root[/\\]RegularModule\.js$/),
        {
          isMock: true,
          value: 1,
        },
      );
      expect(onGenerateMock3).toHaveBeenCalledWith(
        expect.stringMatching(/[/\\]test_root[/\\]RegularModule\.js$/),
        {
          isMock: true,
          value: 2,
        },
      );
    });
  });
});
