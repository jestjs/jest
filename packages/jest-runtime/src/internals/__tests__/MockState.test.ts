/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeProjectConfig} from '@jest/test-utils';
import MockState from '../MockState';
import type Resolution from '../Resolution';

type ResolutionStub = {
  [K in
    | 'getCjsModuleId'
    | 'getEsmModuleId'
    | 'getEsmModuleIdAsync'
    | 'resolveCjs'
    | 'resolveEsm'
    | 'resolveEsmAsync'
    | 'getCjsMockModule'
    | 'getEsmMockModule'
    | 'getEsmMockModuleAsync'
    | 'getModulePath'
    | 'isCoreModule']: jest.MockedFunction<Resolution[K]>;
};

function makeResolution(): {
  resolution: Resolution;
  stub: ResolutionStub;
} {
  const stub: ResolutionStub = {
    getCjsMockModule: jest.fn(() => null),
    getCjsModuleId: jest.fn(
      (_virtualMocks, from, name) => `cjs:${from}:${name ?? ''}`,
    ),
    getEsmMockModule: jest.fn(() => null),
    getEsmMockModuleAsync: jest.fn(async () => null),
    getEsmModuleId: jest.fn(
      (_virtualMocks, from, name) => `esm:${from}:${name ?? ''}`,
    ),
    getEsmModuleIdAsync: jest.fn(
      async (_virtualMocks, from, name) => `esm:${from}:${name ?? ''}`,
    ),
    getModulePath: jest.fn((from, name) => `${from}/${name}`),
    isCoreModule: jest.fn(() => false),
    resolveCjs: jest.fn((_from, name) => `/resolved/cjs/${name}`),
    resolveEsm: jest.fn((_from, name) => `/resolved/esm/${name}`),
    resolveEsmAsync: jest.fn(async (_from, name) => `/resolved/esm/${name}`),
  };
  return {resolution: stub as unknown as Resolution, stub};
}

const config = (overrides: Partial<Parameters<typeof makeProjectConfig>[0]>) =>
  makeProjectConfig({automock: false, ...overrides});

describe('MockState', () => {
  describe('decision predicates', () => {
    test('explicit mock wins over everything else (CJS)', () => {
      const {resolution} = makeResolution();
      const mockState = new MockState(resolution, config({automock: false}));
      mockState.markExplicitCjsMock('/from', './a');
      expect(mockState.shouldMockCjs('/from', './a')).toBe(true);
    });

    test('explicit unmock wins over automock (CJS)', () => {
      const {resolution} = makeResolution();
      const mockState = new MockState(resolution, config({automock: true}));
      mockState.unmockCjs('/from', './a');
      expect(mockState.shouldMockCjs('/from', './a')).toBe(false);
    });

    test('returns false when automock is off and no explicit mark', () => {
      const {resolution} = makeResolution();
      const mockState = new MockState(resolution, config({automock: false}));
      expect(mockState.shouldMockCjs('/from', './a')).toBe(false);
    });

    test('returns true under automock for a normal module', () => {
      const {resolution} = makeResolution();
      const mockState = new MockState(resolution, config({automock: true}));
      expect(mockState.shouldMockCjs('/from', './a')).toBe(true);
    });

    test('caches the decision (second call hits cache, no extra resolveCjs)', () => {
      const {resolution, stub} = makeResolution();
      const mockState = new MockState(resolution, config({automock: true}));
      mockState.shouldMockCjs('/from', './a');
      mockState.shouldMockCjs('/from', './a');
      expect(stub.resolveCjs).toHaveBeenCalledTimes(1);
    });

    test('returns true on resolve failure if a manual mock exists', () => {
      const {resolution, stub} = makeResolution();
      stub.resolveCjs.mockImplementation(() => {
        throw new Error('not found');
      });
      stub.getCjsMockModule.mockReturnValue('/manual/mock/path');
      const mockState = new MockState(resolution, config({automock: true}));
      expect(mockState.shouldMockCjs('/from', './a')).toBe(true);
    });

    test('rethrows resolve error when no manual mock exists', () => {
      const {resolution, stub} = makeResolution();
      stub.resolveCjs.mockImplementation(() => {
        throw new Error('not found');
      });
      const mockState = new MockState(resolution, config({automock: true}));
      expect(() => mockState.shouldMockCjs('/from', './a')).toThrow(
        'not found',
      );
    });

    test('respects unmockedModulePathPatterns', () => {
      const {resolution} = makeResolution();
      const mockState = new MockState(
        resolution,
        config({
          automock: true,
          unmockedModulePathPatterns: ['/resolved/cjs/'],
        }),
      );
      expect(mockState.shouldMockCjs('/from', './a')).toBe(false);
    });

    test('returns false for core modules even under automock', () => {
      const {resolution, stub} = makeResolution();
      stub.isCoreModule.mockReturnValue(true);
      const mockState = new MockState(resolution, config({automock: true}));
      expect(mockState.shouldMockCjs('/from', 'fs')).toBe(false);
    });

    test('shouldMockEsmSync uses ESM resolver and ESM explicit map', () => {
      const {resolution, stub} = makeResolution();
      const mockState = new MockState(resolution, config({automock: true}));
      mockState.shouldMockEsmSync('/from', './a');
      expect(stub.getEsmModuleId).toHaveBeenCalled();
      expect(stub.resolveEsm).toHaveBeenCalled();
    });

    test('shouldMockEsmAsync resolves true via async manual mock on resolve error', async () => {
      const {resolution, stub} = makeResolution();
      stub.resolveEsmAsync.mockImplementation(async () => {
        throw new Error('not found');
      });
      stub.getEsmMockModuleAsync.mockResolvedValue('/manual/mock/path');
      const mockState = new MockState(resolution, config({automock: true}));
      await expect(mockState.shouldMockEsmAsync('/from', './a')).resolves.toBe(
        true,
      );
    });
  });

  describe('explicit registration', () => {
    test('setMock registers a CJS factory', () => {
      const {resolution} = makeResolution();
      const mockState = new MockState(resolution, config({}));
      const factory = jest.fn(() => ({foo: 1}));
      mockState.setMock('/from', './a', factory);
      const moduleID = mockState.getCjsModuleId('/from', './a');
      expect(mockState.hasCjsFactory(moduleID)).toBe(true);
      expect(mockState.getCjsFactory(moduleID)).toBe(factory);
      expect(mockState.shouldMockCjs('/from', './a')).toBe(true);
    });

    test('setModuleMock registers an ESM factory', () => {
      const {resolution} = makeResolution();
      const mockState = new MockState(resolution, config({}));
      const factory = jest.fn();
      mockState.setModuleMock('/from', './a', factory);
      const moduleID = mockState.getEsmModuleId('/from', './a');
      expect(mockState.hasEsmFactory(moduleID)).toBe(true);
      expect(mockState.getEsmFactory(moduleID)).toBe(factory);
    });

    test('setMock with virtual: true registers via getModulePath', () => {
      const {resolution, stub} = makeResolution();
      const mockState = new MockState(resolution, config({}));
      mockState.setMock('/from', './virtual', () => ({}), {virtual: true});
      expect(stub.getModulePath).toHaveBeenCalledWith('/from', './virtual');
    });
  });

  describe('jest-object closure surface', () => {
    test('disable/enableAutomock toggles the predicate', () => {
      const {resolution} = makeResolution();
      const mockState = new MockState(resolution, config({automock: true}));
      mockState.disableAutomock();
      expect(mockState.shouldMockCjs('/from', './a')).toBe(false);
      mockState.enableAutomock();
      expect(mockState.shouldMockCjs('/from', './a')).toBe(true);
    });

    test('deepUnmock prevents transitive automock for descendants', () => {
      const {resolution} = makeResolution();
      const mockState = new MockState(resolution, config({automock: true}));
      mockState.deepUnmock('/from', './a');
      expect(mockState.shouldMockCjs('/from', './a')).toBe(false);
    });

    test('addOnGenerateMock + notifyMockGenerated runs callbacks in order', () => {
      const {resolution} = makeResolution();
      const mockState = new MockState(resolution, config({}));
      mockState.addOnGenerateMock((_name, mock) => ({
        ...(mock as object),
        step: 1,
      }));
      mockState.addOnGenerateMock((_name, mock) => ({
        ...(mock as object),
        step: 2,
      }));
      const result = mockState.notifyMockGenerated<{
        step: number;
        original: boolean;
      }>('/path', {original: true} as never);
      expect(result).toEqual({original: true, step: 2});
    });
  });

  describe('mock metadata cache', () => {
    test('round-trips metadata by modulePath', () => {
      const {resolution} = makeResolution();
      const mockState = new MockState(resolution, config({}));
      expect(mockState.hasMockMetadata('/path')).toBe(false);
      mockState.setMockMetadata('/path', {type: 'object'} as never);
      expect(mockState.hasMockMetadata('/path')).toBe(true);
      expect(mockState.getMockMetadata('/path')).toEqual({type: 'object'});
    });
  });

  describe('clear', () => {
    test('drops factories, explicit marks, virtual marks, callbacks, caches', () => {
      const {resolution} = makeResolution();
      const mockState = new MockState(resolution, config({}));
      mockState.setMock('/from', './a', () => ({}));
      mockState.setModuleMock('/from', './b', () => ({}));
      mockState.markExplicitCjsMock('/from', './c');
      mockState.addOnGenerateMock(() => ({}));
      mockState.setMockMetadata('/path', {} as never);

      mockState.clear();

      expect(
        mockState.hasCjsFactory(mockState.getCjsModuleId('/from', './a')),
      ).toBe(false);
      expect(
        mockState.hasEsmFactory(mockState.getEsmModuleId('/from', './b')),
      ).toBe(false);
      expect(mockState.hasMockMetadata('/path')).toBe(false);
      expect(mockState.notifyMockGenerated('/path', 'x')).toBe('x');
    });
  });
});
