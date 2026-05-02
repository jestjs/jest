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
    getCjsModuleId: jest.fn((_v, from, name) => `cjs:${from}:${name ?? ''}`),
    getEsmMockModule: jest.fn(() => null),
    getEsmMockModuleAsync: jest.fn(async () => null),
    getEsmModuleId: jest.fn((_v, from, name) => `esm:${from}:${name ?? ''}`),
    getEsmModuleIdAsync: jest.fn(
      async (_v, from, name) => `esm:${from}:${name ?? ''}`,
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
      const m = new MockState(resolution, config({automock: false}));
      m.markExplicitCjsMock('/from', './a');
      expect(m.shouldMockCjs('/from', './a')).toBe(true);
    });

    test('explicit unmock wins over automock (CJS)', () => {
      const {resolution} = makeResolution();
      const m = new MockState(resolution, config({automock: true}));
      m.unmockCjs('/from', './a');
      expect(m.shouldMockCjs('/from', './a')).toBe(false);
    });

    test('returns false when automock is off and no explicit mark', () => {
      const {resolution} = makeResolution();
      const m = new MockState(resolution, config({automock: false}));
      expect(m.shouldMockCjs('/from', './a')).toBe(false);
    });

    test('returns true under automock for a normal module', () => {
      const {resolution} = makeResolution();
      const m = new MockState(resolution, config({automock: true}));
      expect(m.shouldMockCjs('/from', './a')).toBe(true);
    });

    test('caches the decision (second call hits cache, no extra resolveCjs)', () => {
      const {resolution, stub} = makeResolution();
      const m = new MockState(resolution, config({automock: true}));
      m.shouldMockCjs('/from', './a');
      m.shouldMockCjs('/from', './a');
      expect(stub.resolveCjs).toHaveBeenCalledTimes(1);
    });

    test('returns true on resolve failure if a manual mock exists', () => {
      const {resolution, stub} = makeResolution();
      stub.resolveCjs.mockImplementation(() => {
        throw new Error('not found');
      });
      stub.getCjsMockModule.mockReturnValue('/manual/mock/path');
      const m = new MockState(resolution, config({automock: true}));
      expect(m.shouldMockCjs('/from', './a')).toBe(true);
    });

    test('rethrows resolve error when no manual mock exists', () => {
      const {resolution, stub} = makeResolution();
      stub.resolveCjs.mockImplementation(() => {
        throw new Error('not found');
      });
      const m = new MockState(resolution, config({automock: true}));
      expect(() => m.shouldMockCjs('/from', './a')).toThrow('not found');
    });

    test('respects unmockedModulePathPatterns', () => {
      const {resolution} = makeResolution();
      const m = new MockState(
        resolution,
        config({
          automock: true,
          unmockedModulePathPatterns: ['/resolved/cjs/'],
        }),
      );
      expect(m.shouldMockCjs('/from', './a')).toBe(false);
    });

    test('returns false for core modules even under automock', () => {
      const {resolution, stub} = makeResolution();
      stub.isCoreModule.mockReturnValue(true);
      const m = new MockState(resolution, config({automock: true}));
      expect(m.shouldMockCjs('/from', 'fs')).toBe(false);
    });

    test('shouldMockEsmSync uses ESM resolver and ESM explicit map', () => {
      const {resolution, stub} = makeResolution();
      const m = new MockState(resolution, config({automock: true}));
      m.shouldMockEsmSync('/from', './a');
      expect(stub.getEsmModuleId).toHaveBeenCalled();
      expect(stub.resolveEsm).toHaveBeenCalled();
    });

    test('shouldMockEsmAsync resolves true via async manual mock on resolve error', async () => {
      const {resolution, stub} = makeResolution();
      stub.resolveEsmAsync.mockImplementation(async () => {
        throw new Error('not found');
      });
      stub.getEsmMockModuleAsync.mockResolvedValue('/manual/mock/path');
      const m = new MockState(resolution, config({automock: true}));
      await expect(m.shouldMockEsmAsync('/from', './a')).resolves.toBe(true);
    });
  });

  describe('explicit registration', () => {
    test('setMock registers a CJS factory', () => {
      const {resolution} = makeResolution();
      const m = new MockState(resolution, config({}));
      const factory = jest.fn(() => ({foo: 1}));
      m.setMock('/from', './a', factory);
      const moduleID = m.getCjsModuleId('/from', './a');
      expect(m.hasCjsFactory(moduleID)).toBe(true);
      expect(m.getCjsFactory(moduleID)).toBe(factory);
      expect(m.shouldMockCjs('/from', './a')).toBe(true);
    });

    test('setModuleMock registers an ESM factory', () => {
      const {resolution} = makeResolution();
      const m = new MockState(resolution, config({}));
      const factory = jest.fn();
      m.setModuleMock('/from', './a', factory);
      const moduleID = m.getEsmModuleId('/from', './a');
      expect(m.hasEsmFactory(moduleID)).toBe(true);
      expect(m.getEsmFactory(moduleID)).toBe(factory);
    });

    test('setMock with virtual: true registers via getModulePath', () => {
      const {resolution, stub} = makeResolution();
      const m = new MockState(resolution, config({}));
      m.setMock('/from', './virtual', () => ({}), {virtual: true});
      expect(stub.getModulePath).toHaveBeenCalledWith('/from', './virtual');
    });
  });

  describe('jest-object closure surface', () => {
    test('disable/enableAutomock toggles the predicate', () => {
      const {resolution} = makeResolution();
      const m = new MockState(resolution, config({automock: true}));
      m.disableAutomock();
      expect(m.shouldMockCjs('/from', './a')).toBe(false);
      m.enableAutomock();
      expect(m.shouldMockCjs('/from', './a')).toBe(true);
    });

    test('deepUnmock prevents transitive automock for descendants', () => {
      const {resolution} = makeResolution();
      const m = new MockState(resolution, config({automock: true}));
      m.deepUnmock('/from', './a');
      expect(m.shouldMockCjs('/from', './a')).toBe(false);
    });

    test('addOnGenerateMock + notifyMockGenerated runs callbacks in order', () => {
      const {resolution} = makeResolution();
      const m = new MockState(resolution, config({}));
      m.addOnGenerateMock((_n, mock) => ({...(mock as object), step: 1}));
      m.addOnGenerateMock((_n, mock) => ({...(mock as object), step: 2}));
      const result = m.notifyMockGenerated<{step: number; original: boolean}>(
        '/p',
        // intentionally wide cast - the callbacks rewrite the shape
        {original: true} as never,
      );
      expect(result).toEqual({original: true, step: 2});
    });
  });

  describe('mock metadata cache', () => {
    test('round-trips metadata by modulePath', () => {
      const {resolution} = makeResolution();
      const m = new MockState(resolution, config({}));
      expect(m.hasMockMetadata('/p')).toBe(false);
      // The shape of MockMetadata isn't exercised - we just stash & fetch.
      m.setMockMetadata('/p', {type: 'object'} as never);
      expect(m.hasMockMetadata('/p')).toBe(true);
      expect(m.getMockMetadata('/p')).toEqual({type: 'object'});
    });
  });

  describe('clear', () => {
    test('drops factories, explicit marks, virtual marks, callbacks, caches', () => {
      const {resolution} = makeResolution();
      const m = new MockState(resolution, config({}));
      m.setMock('/from', './a', () => ({}));
      m.setModuleMock('/from', './b', () => ({}));
      m.markExplicitCjsMock('/from', './c');
      m.addOnGenerateMock(() => ({}));
      m.setMockMetadata('/p', {} as never);

      m.clear();

      expect(m.hasCjsFactory(m.getCjsModuleId('/from', './a'))).toBe(false);
      expect(m.hasEsmFactory(m.getEsmModuleId('/from', './b'))).toBe(false);
      expect(m.hasMockMetadata('/p')).toBe(false);
      // notifyMockGenerated returns input unchanged when callback set is empty.
      expect(m.notifyMockGenerated('/p', 'x')).toBe('x');
    });
  });
});
