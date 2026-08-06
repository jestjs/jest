/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CjsExportsCache} from '../CjsExportsCache';
import type {FileCache} from '../FileCache';
import {CjsParseError} from '../ModuleExecutor';
import type {Resolution} from '../Resolution';
import type {TransformCache} from '../TransformCache';

const makeTransformCache = (
  cached: string | undefined = undefined,
): TransformCache =>
  ({
    getCachedSource: jest.fn(() => cached),
  }) as unknown as TransformCache;

function makeResolution(overrides: Partial<Resolution> = {}) {
  const resolveCjs: jest.MockedFunction<Resolution['resolveCjs']> = jest.fn(
    (_from, to) => `/resolved/${to}`,
  );
  const isCoreModule: jest.MockedFunction<Resolution['isCoreModule']> = jest.fn(
    () => false,
  );
  return {
    isCoreModule,
    resolution: {
      isCoreModule,
      resolveCjs,
      ...overrides,
    } as unknown as Resolution,
    resolveCjs,
  };
}

function makeFileCache(files: Record<string, string> = {}) {
  const readFile: jest.MockedFunction<FileCache['readFile']> = jest.fn(p => {
    if (!(p in files)) throw new Error(`unexpected readFile(${p})`);
    return files[p];
  });
  return {fileCache: {readFile} as unknown as FileCache, readFile};
}

describe('CjsExportsCache', () => {
  test('parses exports via cjs-module-lexer and caches by modulePath', () => {
    const {resolution} = makeResolution();
    const {fileCache, readFile} = makeFileCache({
      '/m.js': 'module.exports.foo = 1; module.exports.bar = 2;',
    });
    const cache = new CjsExportsCache({
      fileCache,
      loadCoreReexport: jest.fn(),
      loadNativeAddon: jest.fn(),
      resolution,
      transformCache: makeTransformCache(),
    });

    expect([...cache.getExportsOf('/from.js', '/m.js')]).toEqual([
      'foo',
      'bar',
    ]);
    expect([...cache.getExportsOf('/from.js', '/m.js')]).toEqual([
      'foo',
      'bar',
    ]);
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  test('prefers transformed code over reading the file fresh', () => {
    const {resolution} = makeResolution();
    const {fileCache, readFile} = makeFileCache();
    const cache = new CjsExportsCache({
      fileCache,
      loadCoreReexport: jest.fn(),
      loadNativeAddon: jest.fn(),
      resolution,
      transformCache: makeTransformCache('module.exports.transformed = 1;'),
    });

    expect([...cache.getExportsOf('/from.js', '/m.js')]).toEqual([
      'transformed',
    ]);
    expect(readFile).not.toHaveBeenCalled();
  });

  test('walks resolved CJS re-exports recursively', () => {
    const {resolution} = makeResolution();
    const {fileCache} = makeFileCache({
      '/a.js': "module.exports.a = 1; module.exports = require('./b');",
      '/resolved/./b': 'module.exports.b = 1;',
    });
    const cache = new CjsExportsCache({
      fileCache,
      loadCoreReexport: jest.fn(),
      loadNativeAddon: jest.fn(),
      resolution,
      transformCache: makeTransformCache(),
    });

    expect([...cache.getExportsOf('/from.js', '/a.js')].sort()).toEqual([
      'a',
      'b',
    ]);
  });

  test('loads core-module re-exports via the loadCoreReexport callback', () => {
    const {resolution, isCoreModule} = makeResolution();
    isCoreModule.mockImplementation((name: string) => name === 'fs');
    const {fileCache} = makeFileCache({
      '/m.js': "module.exports = require('fs');",
    });
    const loadCoreReexport = jest
      .fn()
      .mockReturnValue({readFileSync: () => {}, writeFileSync: () => {}});
    const cache = new CjsExportsCache({
      fileCache,
      loadCoreReexport,
      loadNativeAddon: jest.fn(),
      resolution,
      transformCache: makeTransformCache(),
    });

    expect([...cache.getExportsOf('/from.js', '/m.js')].sort()).toEqual([
      'readFileSync',
      'writeFileSync',
    ]);
    expect(loadCoreReexport).toHaveBeenCalledWith('/m.js', 'fs');
  });

  test('reads native (.node) addon exports via loadNativeAddon', () => {
    const {resolution} = makeResolution();
    const {fileCache, readFile} = makeFileCache();
    const loadNativeAddon = jest.fn().mockReturnValue({nativeFn: () => {}});
    const cache = new CjsExportsCache({
      fileCache,
      loadCoreReexport: jest.fn(),
      loadNativeAddon,
      resolution,
      transformCache: makeTransformCache(),
    });

    expect([...cache.getExportsOf('/from.js', '/addon.node')]).toEqual([
      'nativeFn',
    ]);
    expect(loadNativeAddon).toHaveBeenCalledWith('/from.js', '/addon.node');
    expect(readFile).not.toHaveBeenCalled();
  });

  test('throws CjsParseError when source contains ESM syntax', () => {
    const {resolution} = makeResolution();
    const {fileCache} = makeFileCache({
      '/esm.js': 'export default function thunk() {}',
    });
    const cache = new CjsExportsCache({
      fileCache,
      loadCoreReexport: jest.fn(),
      loadNativeAddon: jest.fn(),
      resolution,
      transformCache: makeTransformCache(),
    });

    expect(() => cache.getExportsOf('/from.js', '/esm.js')).toThrow(
      CjsParseError,
    );
  });

  test('clear() drops the cache so subsequent calls re-parse', () => {
    const {resolution} = makeResolution();
    const {fileCache, readFile} = makeFileCache({
      '/m.js': 'module.exports.foo = 1;',
    });
    const cache = new CjsExportsCache({
      fileCache,
      loadCoreReexport: jest.fn(),
      loadNativeAddon: jest.fn(),
      resolution,
      transformCache: makeTransformCache(),
    });

    cache.getExportsOf('/from.js', '/m.js');
    cache.clear();
    cache.getExportsOf('/from.js', '/m.js');
    expect(readFile).toHaveBeenCalledTimes(2);
  });
});
