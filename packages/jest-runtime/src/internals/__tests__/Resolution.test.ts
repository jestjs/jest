/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import * as fs from 'graceful-fs';
import {testWithVmEsm} from '@jest/test-utils';
import type Resolver from 'jest-resolve';
import {Resolution} from '../Resolution';

jest.mock('graceful-fs', () => ({
  ...jest.requireActual<typeof import('graceful-fs')>('graceful-fs'),
  existsSync: jest.fn(() => false),
}));

const CJS = ['require', 'node', 'default'];
const ESM = ['import', 'default'];

function makeResolver(overrides: Partial<Resolver> = {}): Resolver {
  const base = {
    canResolveSync: jest.fn(() => true),
    getGlobalPaths: jest.fn(() => ['/g']),
    getMockModule: jest.fn(() => '/mock'),
    getMockModuleAsync: jest.fn(async () => '/mock-async'),
    getModule: jest.fn(() => '/m'),
    getModuleID: jest.fn(() => 'id'),
    getModuleIDAsync: jest.fn(async () => 'id-async'),
    getModulePath: jest.fn(() => '/mp'),
    getModulePaths: jest.fn(() => ['/p']),
    isCoreModule: jest.fn(() => false),
    normalizeCoreModuleSpecifier: jest.fn((n: string) => n),
    resolveModule: jest.fn((_from: string, to: string) => `/resolved/${to}`),
    resolveModuleAsync: jest.fn(
      async (_from: string, to: string) => `/resolved-async/${to}`,
    ),
    resolveModuleFromDirIfExists: jest.fn(() => '/from-dir'),
    resolveStubModuleName: jest.fn(() => '/stub'),
  };
  return {...base, ...overrides} as unknown as Resolver;
}

describe('Resolution', () => {
  describe('conditions', () => {
    test('with no env conditions, uses Node defaults', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      r.resolveCjs('/a', 'foo');
      r.resolveEsm('/a', 'foo');

      expect(resolver.resolveModule).toHaveBeenNthCalledWith(1, '/a', 'foo', {
        conditions: CJS,
      });
      expect(resolver.resolveModule).toHaveBeenNthCalledWith(2, '/a', 'foo', {
        conditions: ESM,
      });
    });

    test('appends env-provided conditions and de-dupes', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, ['default', 'browser'], []);

      r.resolveCjs('/a', 'foo');
      r.resolveEsm('/a', 'foo');

      expect(resolver.resolveModule).toHaveBeenNthCalledWith(1, '/a', 'foo', {
        conditions: ['require', 'node', 'default', 'browser'],
      });
      expect(resolver.resolveModule).toHaveBeenNthCalledWith(2, '/a', 'foo', {
        conditions: ['import', 'default', 'browser'],
      });
    });
  });

  describe('sync resolve cache', () => {
    test('caches by (from, to) and only calls underlying resolver once', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      expect(r.resolveCjs('/a', 'foo')).toBe('/resolved/foo');
      expect(r.resolveCjs('/a', 'foo')).toBe('/resolved/foo');
      expect(r.resolveCjs('/a', 'bar')).toBe('/resolved/bar');

      expect(resolver.resolveModule).toHaveBeenCalledTimes(2);
      expect(resolver.resolveModule).toHaveBeenNthCalledWith(1, '/a', 'foo', {
        conditions: CJS,
      });
      expect(resolver.resolveModule).toHaveBeenNthCalledWith(2, '/a', 'bar', {
        conditions: CJS,
      });
    });

    test('cjs and esm caches are independent', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      r.resolveCjs('/a', 'foo');
      r.resolveEsm('/a', 'foo');

      expect(resolver.resolveModule).toHaveBeenCalledTimes(2);
      expect(resolver.resolveModule).toHaveBeenNthCalledWith(1, '/a', 'foo', {
        conditions: CJS,
      });
      expect(resolver.resolveModule).toHaveBeenNthCalledWith(2, '/a', 'foo', {
        conditions: ESM,
      });
    });

    test('falsy `to` short-circuits to `from` without consulting the resolver', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      expect(r.resolveCjs('/a', undefined)).toBe('/a');
      expect(r.resolveEsm('/a', undefined)).toBe('/a');
      expect(resolver.resolveModule).not.toHaveBeenCalled();
    });

    test('clear() drops both caches', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      r.resolveCjs('/a', 'foo');
      r.resolveEsm('/a', 'foo');
      expect(resolver.resolveModule).toHaveBeenCalledTimes(2);

      r.clear();
      r.resolveCjs('/a', 'foo');
      r.resolveEsm('/a', 'foo');
      expect(resolver.resolveModule).toHaveBeenCalledTimes(4);
    });
  });

  describe('async resolve', () => {
    test('does not cache (each call hits the resolver)', async () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      await r.resolveEsmAsync('/a', 'foo');
      await r.resolveEsmAsync('/a', 'foo');

      expect(resolver.resolveModuleAsync).toHaveBeenCalledTimes(2);
      expect(resolver.resolveModuleAsync).toHaveBeenCalledWith('/a', 'foo', {
        conditions: ESM,
      });
    });

    test('falsy `to` short-circuits to `from`', async () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      await expect(r.resolveEsmAsync('/a', undefined)).resolves.toBe('/a');
      expect(resolver.resolveModuleAsync).not.toHaveBeenCalled();
    });
  });

  describe('moduleID lookups pass the right conditions', () => {
    const virtualMocks = new Map<string, boolean>();

    test('getCjsModuleId uses cjs conditions', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      r.getCjsModuleId(virtualMocks, '/a', 'foo');
      expect(resolver.getModuleID).toHaveBeenCalledWith(
        virtualMocks,
        '/a',
        'foo',
        {conditions: CJS},
      );
    });

    test('getEsmModuleId uses esm conditions', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      r.getEsmModuleId(virtualMocks, '/a', 'foo');
      expect(resolver.getModuleID).toHaveBeenCalledWith(
        virtualMocks,
        '/a',
        'foo',
        {conditions: ESM},
      );
    });

    test('getEsmModuleIdAsync uses esm conditions', async () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      await r.getEsmModuleIdAsync(virtualMocks, '/a', 'foo');
      expect(resolver.getModuleIDAsync).toHaveBeenCalledWith(
        virtualMocks,
        '/a',
        'foo',
        {conditions: ESM},
      );
    });
  });

  describe('mock module lookups', () => {
    test('getCjsMockModule uses cjs conditions', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      expect(r.getCjsMockModule('/a', 'foo')).toBe('/mock');
      expect(resolver.getMockModule).toHaveBeenCalledWith('/a', 'foo', {
        conditions: CJS,
      });
    });

    test('getEsmMockModule uses esm conditions', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      expect(r.getEsmMockModule('/a', 'foo')).toBe('/mock');
      expect(resolver.getMockModule).toHaveBeenCalledWith('/a', 'foo', {
        conditions: ESM,
      });
    });

    test('getEsmMockModuleAsync uses esm conditions', async () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      await expect(r.getEsmMockModuleAsync('/a', 'foo')).resolves.toBe(
        '/mock-async',
      );
      expect(resolver.getMockModuleAsync).toHaveBeenCalledWith('/a', 'foo', {
        conditions: ESM,
      });
    });

    test('resolveCjsStub uses cjs conditions', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      expect(r.resolveCjsStub('/a', 'foo')).toBe('/stub');
      expect(resolver.resolveStubModuleName).toHaveBeenCalledWith('/a', 'foo', {
        conditions: CJS,
      });
    });

    test('resolveCjsFromDirIfExists forwards conditions and paths', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      r.resolveCjsFromDirIfExists('/dir', 'foo', ['/p1']);
      expect(resolver.resolveModuleFromDirIfExists).toHaveBeenCalledWith(
        '/dir',
        'foo',
        {conditions: CJS, paths: ['/p1']},
      );

      r.resolveCjsFromDirIfExists('/dir', 'foo');
      expect(resolver.resolveModuleFromDirIfExists).toHaveBeenLastCalledWith(
        '/dir',
        'foo',
        {conditions: CJS, paths: undefined},
      );
    });
  });

  describe('findManualMock', () => {
    const existsSync = fs.existsSync as jest.MockedFunction<
      typeof fs.existsSync
    >;

    beforeEach(() => {
      existsSync.mockReset();
      existsSync.mockReturnValue(false);
    });

    test('returns the root manual mock for a non-core specifier', () => {
      const resolver = makeResolver({
        getMockModule: jest.fn(() => '/root-mock.js'),
      });
      const r = new Resolution(resolver, [], []);
      expect(r.findManualMock('/from.js', 'lib')).toBe('/root-mock.js');
    });

    test('uses normalized core module specifier when isCoreModule is true', () => {
      const resolver = makeResolver({
        getMockModule: jest.fn(() => '/core-mock.js'),
        isCoreModule: jest.fn(() => true),
        normalizeCoreModuleSpecifier: jest.fn(() => 'fs'),
      });
      const r = new Resolution(resolver, [], []);
      expect(r.findManualMock('/from.js', 'node:fs')).toBe('/core-mock.js');
      expect(resolver.normalizeCoreModuleSpecifier).toHaveBeenCalledWith(
        'node:fs',
      );
      expect(resolver.getMockModule).toHaveBeenCalledWith('/from.js', 'fs', {
        conditions: CJS,
      });
    });

    test('falls back to sibling __mocks__ entry when fs.existsSync agrees', () => {
      const resolver = makeResolver({
        getMockModule: jest.fn(() => null),
        resolveModule: jest.fn(() => '/path/to/lib.js'),
      });
      existsSync.mockReturnValue(true);
      const r = new Resolution(resolver, [], []);
      const expected = path.join('/path/to', '__mocks__', 'lib.js');
      expect(r.findManualMock('/from.js', 'lib')).toBe(expected);
      expect(existsSync).toHaveBeenCalledWith(expected);
    });

    test('returns null when neither root nor sibling mock exists', () => {
      const resolver = makeResolver({
        getMockModule: jest.fn(() => null),
        resolveModule: jest.fn(() => '/path/to/lib.js'),
      });
      const r = new Resolution(resolver, [], []);
      expect(r.findManualMock('/from.js', 'lib')).toBeNull();
    });

    test('caches the result so repeated calls do not re-stat', () => {
      const resolver = makeResolver({
        getMockModule: jest.fn(() => null),
        resolveModule: jest.fn(() => '/path/to/lib.js'),
      });
      const r = new Resolution(resolver, [], []);
      r.findManualMock('/from.js', 'lib');
      r.findManualMock('/from.js', 'lib');
      r.findManualMock('/from.js', 'lib');
      expect(existsSync).toHaveBeenCalledTimes(1);
      expect(resolver.getMockModule).toHaveBeenCalledTimes(1);
    });

    test('caches negative results (null) too', () => {
      const resolver = makeResolver({
        getMockModule: jest.fn(() => null),
        resolveModule: jest.fn(() => '/path/to/lib.js'),
      });
      const r = new Resolution(resolver, [], []);
      expect(r.findManualMock('/from.js', 'lib')).toBeNull();
      expect(r.findManualMock('/from.js', 'lib')).toBeNull();
      expect(existsSync).toHaveBeenCalledTimes(1);
    });

    test('shares cache between core specifier and its `node:`-prefixed form', () => {
      const resolver = makeResolver({
        getMockModule: jest.fn(() => '/core-mock.js'),
        isCoreModule: jest.fn(() => true),
        normalizeCoreModuleSpecifier: jest.fn((name: string) =>
          name.replace(/^node:/, ''),
        ),
      });
      const r = new Resolution(resolver, [], []);
      r.findManualMock('/from.js', 'fs');
      r.findManualMock('/from.js', 'node:fs');
      // Both call sites should hit the same cache entry - only one underlying
      // `getMockModule` lookup, not two.
      expect(resolver.getMockModule).toHaveBeenCalledTimes(1);
    });

    test('clear() drops the manual-mock cache', () => {
      const resolver = makeResolver({
        getMockModule: jest.fn(() => null),
        resolveModule: jest.fn(() => '/path/to/lib.js'),
      });
      const r = new Resolution(resolver, [], []);
      r.findManualMock('/from.js', 'lib');
      r.clear();
      r.findManualMock('/from.js', 'lib');
      expect(existsSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('pure pass-throughs', () => {
    test('forwards calls without options', () => {
      const resolver = makeResolver();
      const r = new Resolution(resolver, [], []);

      expect(r.isCoreModule('fs')).toBe(false);
      expect(resolver.isCoreModule).toHaveBeenCalledWith('fs');

      expect(r.normalizeCoreModuleSpecifier('node:fs')).toBe('node:fs');
      expect(resolver.normalizeCoreModuleSpecifier).toHaveBeenCalledWith(
        'node:fs',
      );

      expect(r.getModule('foo')).toBe('/m');
      expect(r.getModulePath('/a', 'foo')).toBe('/mp');
      expect(r.getModulePaths('/a')).toEqual(['/p']);
      expect(r.getGlobalPaths('foo')).toEqual(['/g']);
      expect(r.canResolveSync()).toBe(true);
    });
  });

  describe('shouldLoadAsEsm', () => {
    test('returns true for .wasm regardless of config', () => {
      const r = new Resolution(makeResolver(), [], []);
      expect(r.shouldLoadAsEsm('/a/b.wasm')).toBe(true);
    });

    testWithVmEsm('returns true for .mjs', () => {
      const r = new Resolution(makeResolver(), [], []);
      expect(r.shouldLoadAsEsm('/a/b.mjs')).toBe(true);
    });

    testWithVmEsm(
      'returns false for .js without an ESM-marker package.json',
      () => {
        const r = new Resolution(makeResolver(), [], []);
        expect(r.shouldLoadAsEsm('/a/b.js')).toBe(false);
      },
    );

    testWithVmEsm('honors extensionsToTreatAsEsm', () => {
      const r = new Resolution(makeResolver(), [], ['.ts']);
      expect(r.shouldLoadAsEsm('/a/b.ts')).toBe(true);
    });
  });
});
