/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CjsExportsCache} from '../CjsExportsCache';
import type {FileCache} from '../FileCache';
import type {Resolution} from '../Resolution';

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
    const cache = new CjsExportsCache(
      resolution,
      fileCache,
      () => undefined,
      jest.fn(),
      jest.fn(),
    );

    expect([...cache.getExportsOf('/m.js')]).toEqual(['foo', 'bar']);
    expect([...cache.getExportsOf('/m.js')]).toEqual(['foo', 'bar']);
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  test('prefers transformed code over reading the file fresh', () => {
    const {resolution} = makeResolution();
    const {fileCache, readFile} = makeFileCache();
    const cache = new CjsExportsCache(
      resolution,
      fileCache,
      () => 'module.exports.transformed = 1;',
      jest.fn(),
      jest.fn(),
    );

    expect([...cache.getExportsOf('/m.js')]).toEqual(['transformed']);
    expect(readFile).not.toHaveBeenCalled();
  });

  test('walks resolved CJS re-exports recursively', () => {
    const {resolution} = makeResolution();
    const {fileCache} = makeFileCache({
      '/a.js': "module.exports.a = 1; module.exports = require('./b');",
      '/resolved/./b': 'module.exports.b = 1;',
    });
    const cache = new CjsExportsCache(
      resolution,
      fileCache,
      () => undefined,
      jest.fn(),
      jest.fn(),
    );

    expect([...cache.getExportsOf('/a.js')].sort()).toEqual(['a', 'b']);
  });

  test('loads core-module re-exports via the requireModule callback', () => {
    const {resolution, isCoreModule} = makeResolution();
    isCoreModule.mockImplementation((name: string) => name === 'fs');
    const {fileCache} = makeFileCache({
      '/m.js': "module.exports = require('fs');",
    });
    const requireModule = jest
      .fn()
      .mockReturnValue({readFileSync: () => {}, writeFileSync: () => {}});
    const cache = new CjsExportsCache(
      resolution,
      fileCache,
      () => undefined,
      requireModule,
      jest.fn(),
    );

    expect([...cache.getExportsOf('/m.js')].sort()).toEqual([
      'readFileSync',
      'writeFileSync',
    ]);
    expect(requireModule).toHaveBeenCalledWith('/m.js', 'fs');
  });

  test('reads native (.node) addon exports via requireModuleOrMock', () => {
    const {resolution} = makeResolution();
    const {fileCache, readFile} = makeFileCache();
    const requireModuleOrMock = jest.fn().mockReturnValue({nativeFn: () => {}});
    const cache = new CjsExportsCache(
      resolution,
      fileCache,
      () => undefined,
      jest.fn(),
      requireModuleOrMock,
    );

    expect([...cache.getExportsOf('/addon.node')]).toEqual(['nativeFn']);
    expect(requireModuleOrMock).toHaveBeenCalledWith('', '/addon.node');
    expect(readFile).not.toHaveBeenCalled();
  });

  test('clear() drops the cache so subsequent calls re-parse', () => {
    const {resolution} = makeResolution();
    const {fileCache, readFile} = makeFileCache({
      '/m.js': 'module.exports.foo = 1;',
    });
    const cache = new CjsExportsCache(
      resolution,
      fileCache,
      () => undefined,
      jest.fn(),
      jest.fn(),
    );

    cache.getExportsOf('/m.js');
    cache.clear();
    cache.getExportsOf('/m.js');
    expect(readFile).toHaveBeenCalledTimes(2);
  });
});
