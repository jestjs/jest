/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  ScriptTransformer,
  TransformResult,
  TransformationOptions,
} from '@jest/transform';
import type {FileCache} from '../FileCache';
import {TransformCache, type TransformOptions} from '../TransformCache';

const internalOptions: TransformOptions = {
  isInternalModule: true,
  supportsDynamicImport: false,
  supportsExportNamespaceFrom: false,
  supportsStaticESM: false,
  supportsTopLevelAwait: false,
};

const userOptions: TransformOptions = {
  ...internalOptions,
  isInternalModule: false,
};

function transformResult(
  code: string,
  sourceMapPath: string | null = null,
): TransformResult {
  return {code, originalCode: code, sourceMapPath};
}

function makeFixture(
  source = 'console.log("orig")',
  result: TransformResult = transformResult('console.log("transformed")'),
) {
  const readFile: jest.MockedFunction<FileCache['readFile']> = jest.fn(
    () => source,
  );
  const fileCache = {readFile} as unknown as FileCache;

  const transform: jest.MockedFunction<ScriptTransformer['transform']> =
    jest.fn(() => result);
  const transformAsync: jest.MockedFunction<
    ScriptTransformer['transformAsync']
  > = jest.fn(async () => result);
  const scriptTransformer = {
    transform,
    transformAsync,
  } as unknown as ScriptTransformer;

  const getOptions: jest.MockedFunction<
    (options: TransformOptions | undefined) => TransformationOptions
  > = jest.fn(
    options => ({...options!, collectCoverage: false}) as TransformationOptions,
  );

  const cache = new TransformCache(scriptTransformer, fileCache, getOptions);
  return {
    cache,
    fileCache,
    getOptions,
    readFile,
    scriptTransformer,
    transform,
    transformAsync,
  };
}

describe('TransformCache', () => {
  describe('transform', () => {
    test('reads source, transforms, caches the result, returns transformed code', () => {
      const {cache, transform} = makeFixture(
        'orig',
        transformResult('TRANSFORMED'),
      );
      expect(cache.transform('/a.js', userOptions)).toBe('TRANSFORMED');
      expect(transform).toHaveBeenCalledTimes(1);
      expect(cache.getCachedSource('/a.js')).toBe('TRANSFORMED');
    });

    test('skips transform for internal modules and returns raw source', () => {
      const {cache, transform} = makeFixture('orig');
      expect(cache.transform('/a.js', internalOptions)).toBe('orig');
      expect(transform).not.toHaveBeenCalled();
      expect(cache.getCachedSource('/a.js')).toBeUndefined();
    });

    test('records sourceMapPath in the source-map registry', () => {
      const {cache} = makeFixture(
        'orig',
        transformResult('transformed', '/maps/a.js.map'),
      );
      cache.transform('/a.js', userOptions);
      expect(cache.getSourceMaps().get('/a.js')).toBe('/maps/a.js.map');
    });

    test('forwards options through getFullTransformationOptions', () => {
      const {cache, getOptions, transform} = makeFixture();
      cache.transform('/a.js', userOptions);
      expect(getOptions).toHaveBeenCalledWith(userOptions);
      expect(transform).toHaveBeenCalledWith(
        '/a.js',
        expect.objectContaining({collectCoverage: false}),
        'console.log("orig")',
      );
    });
  });

  describe('transformAsync', () => {
    test('caches transformed code and exposes it via getCachedSource', async () => {
      const {cache, transformAsync} = makeFixture(
        'orig',
        transformResult('ASYNC'),
      );
      await expect(cache.transformAsync('/a.js', userOptions)).resolves.toBe(
        'ASYNC',
      );
      expect(transformAsync).toHaveBeenCalledTimes(1);
      expect(cache.getCachedSource('/a.js')).toBe('ASYNC');
    });

    test('skips transform for internal modules', async () => {
      const {cache, transformAsync} = makeFixture('orig');
      await expect(
        cache.transformAsync('/a.js', internalOptions),
      ).resolves.toBe('orig');
      expect(transformAsync).not.toHaveBeenCalled();
    });
  });

  describe('mutex', () => {
    test('hasMutex / awaitMutex / setMutex behave like a Map', async () => {
      const {cache} = makeFixture();
      expect(cache.hasMutex('/key')).toBe(false);

      let resolveMutex!: () => void;
      const mutexPromise = new Promise<void>(resolve => {
        resolveMutex = resolve;
      });
      cache.setMutex('/key', mutexPromise);

      expect(cache.hasMutex('/key')).toBe(true);
      const awaited = cache.awaitMutex('/key');
      resolveMutex();
      await expect(awaited).resolves.toBeUndefined();
    });
  });

  describe('clear semantics', () => {
    test('clearForReset drops transforms + mutex but preserves source maps', () => {
      const {cache} = makeFixture(
        'orig',
        transformResult('transformed', '/maps/a.js.map'),
      );
      cache.transform('/a.js', userOptions);
      cache.setMutex('/key', Promise.resolve());

      cache.clearForReset();
      expect(cache.getCachedSource('/a.js')).toBeUndefined();
      expect(cache.hasMutex('/key')).toBe(false);
      expect(cache.getSourceMaps().get('/a.js')).toBe('/maps/a.js.map');
    });

    test('clear drops everything including source maps', () => {
      const {cache} = makeFixture(
        'orig',
        transformResult('transformed', '/maps/a.js.map'),
      );
      cache.transform('/a.js', userOptions);

      cache.clear();
      expect(cache.getCachedSource('/a.js')).toBeUndefined();
      expect(cache.getSourceMaps().get('/a.js')).toBeUndefined();
    });
  });

  test('getEntries returns the live map (read-only consumers see updates)', () => {
    const {cache} = makeFixture('orig', transformResult('transformed'));
    const entries = cache.getEntries();
    expect(entries.size).toBe(0);
    cache.transform('/a.js', userOptions);
    expect(entries.size).toBe(1);
    expect(entries.get('/a.js')?.code).toBe('transformed');
  });
});
