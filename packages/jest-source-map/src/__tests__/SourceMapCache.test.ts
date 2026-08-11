/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {SourceMapCache, mapSourcePosition} from '../SourceMapCache';

jest.mock('graceful-fs');

// Built with `path` so the expectations survive on Windows, where the resolved
// source of a mapping comes back with backslashes. Both paths are per-test:
// parsed maps are held against the map path and the map path is remembered
// against the generated path, both for the lifetime of the process.
let buildDir = '';
let generatedPath = '';
let adjacentMapPath = '';
let originalPath = '';
let registeredMapPath = '';
let mapPathCounter = 0;

// Generated line 2, column 0 maps to input.ts line 10, column 2, named `double`.
const decodedMap = {
  file: 'out.js',
  mappings: [[], [[0, 0, 9, 2, 0]]],
  names: ['double'],
  sources: ['input.ts'],
  version: 3,
};

const readFileMock = jest.mocked(fs.readFileSync);
const existsSyncMock = jest.mocked(fs.existsSync);

// `readFileSync` is overloaded, so an implementation returning a string does
// not satisfy its type directly.
function mockFileContents(read: (filePath: string) => string) {
  readFileMock.mockImplementation(read as unknown as typeof fs.readFileSync);
}

beforeEach(() => {
  jest.clearAllMocks();
  existsSyncMock.mockReturnValue(true);
  mapPathCounter += 1;
  buildDir = path.resolve(path.sep, 'repo', `build-${mapPathCounter}`);
  generatedPath = path.join(buildDir, 'out.js');
  adjacentMapPath = path.join(buildDir, 'out.js.map');
  originalPath = path.join(buildDir, 'input.ts');
  registeredMapPath = path.resolve(
    path.sep,
    'cache',
    `out-${mapPathCounter}.js.map`,
  );
});

describe('SourceMapCache', () => {
  test('parses a map registered by the transform pipeline', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const cache = new SourceMapCache(
      new Map([[generatedPath, registeredMapPath]]),
    );

    expect(cache.get(generatedPath)).toEqual({
      map: expect.anything(),
      url: generatedPath,
    });
    expect(readFileMock).toHaveBeenCalledWith(registeredMapPath, 'utf8');
  });

  test('parses each map file only once', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const cache = new SourceMapCache(
      new Map([[generatedPath, registeredMapPath]]),
    );
    const first = cache.get(generatedPath);

    expect(cache.get(generatedPath)).toBe(first);
    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  test('caches the absence of a map', () => {
    mockFileContents(() => 'no sourceMappingURL here');

    const cache = new SourceMapCache(new Map());

    expect(cache.get(generatedPath)).toBeNull();
    expect(cache.get(generatedPath)).toBeNull();
    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  test('reads an indexed map built from `sections`', () => {
    mockFileContents(() =>
      JSON.stringify({
        file: 'out.js',
        sections: [{map: decodedMap, offset: {column: 0, line: 0}}],
        version: 3,
      }),
    );

    const cache = new SourceMapCache(
      new Map([[generatedPath, registeredMapPath]]),
    );

    expect(
      mapSourcePosition(cache, {column: 0, line: 2, source: generatedPath}),
    ).toEqual({column: 2, line: 10, name: 'double', source: originalPath});
  });

  test('re-checks the registry after a miss, since it fills in lazily', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const sourceMaps = new Map<string, string>();
    const cache = new SourceMapCache(sourceMaps);

    expect(cache.get(generatedPath)).toBeNull();

    sourceMaps.set(generatedPath, registeredMapPath);

    expect(cache.get(generatedPath)).toEqual({
      map: expect.anything(),
      url: generatedPath,
    });
  });

  test('does not retry a registered map that failed to load', () => {
    mockFileContents(() => '{not json');

    const cache = new SourceMapCache(
      new Map([[generatedPath, registeredMapPath]]),
    );

    cache.get(generatedPath);
    cache.get(generatedPath);
    cache.get(generatedPath);

    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  test('parses a map once for every file that shares the cache path', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    // Two test files in one worker: different registries, same transform-cache
    // entry, so the map should be read and parsed only once.
    const first = new SourceMapCache(
      new Map([[generatedPath, registeredMapPath]]),
    );
    const second = new SourceMapCache(
      new Map([[generatedPath, registeredMapPath]]),
    );

    expect(first.get(generatedPath)).not.toBeNull();
    expect(second.get(generatedPath)).not.toBeNull();
    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  // The runtime empties the registry at teardown, and stacks are still
  // formatted after that — a stray timer, a floating promise.
  test('keeps a loaded map after the registry is emptied', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const sourceMaps = new Map([[generatedPath, registeredMapPath]]);
    const cache = new SourceMapCache(sourceMaps);
    const loaded = cache.get(generatedPath);

    sourceMaps.clear();

    expect(cache.get(generatedPath)).toBe(loaded);
  });

  // A worker runs the next test file while a stray timer from the previous one
  // can still throw, and that frame names a file the new registry never saw.
  test('still resolves a file the current registry has never seen', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const first = new SourceMapCache(
      new Map([[generatedPath, registeredMapPath]]),
    );

    expect(first.get(generatedPath)).not.toBeNull();

    const next = new SourceMapCache(new Map());

    expect(next.get(generatedPath)).toEqual({
      map: expect.anything(),
      url: generatedPath,
    });
  });

  test('survives an unparsable map', () => {
    mockFileContents(() => '{not json');

    const cache = new SourceMapCache(
      new Map([[generatedPath, registeredMapPath]]),
    );

    expect(cache.get(generatedPath)).toBeNull();
  });

  describe('for files the transform pipeline did not map', () => {
    test('reads an inline `data:` sourceMappingURL', () => {
      const inline = Buffer.from(JSON.stringify(decodedMap)).toString('base64');

      mockFileContents(
        () =>
          `code();\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${inline}\n`,
      );

      const cache = new SourceMapCache(new Map());

      expect(cache.get(generatedPath)).toEqual({
        map: expect.anything(),
        url: generatedPath,
      });
      expect(readFileMock).toHaveBeenCalledTimes(1);
    });

    test('follows a relative sourceMappingURL', () => {
      mockFileContents(filePath =>
        filePath === generatedPath
          ? 'code();\n//# sourceMappingURL=out.js.map\n'
          : JSON.stringify(decodedMap),
      );

      const cache = new SourceMapCache(new Map());

      expect(cache.get(generatedPath)).toEqual({
        map: expect.anything(),
        url: adjacentMapPath,
      });
    });

    test('picks the last sourceMappingURL in the file', () => {
      mockFileContents(filePath =>
        filePath === generatedPath
          ? '//# sourceMappingURL=from-a-string.map\ncode();\n//# sourceMappingURL=out.js.map\n'
          : JSON.stringify(decodedMap),
      );

      const cache = new SourceMapCache(new Map());

      expect(cache.get(generatedPath)?.url).toBe(adjacentMapPath);
    });
  });
});

describe('mapSourcePosition', () => {
  test('translates a mapped position and resolves the source next to the map', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const cache = new SourceMapCache(
      new Map([[generatedPath, registeredMapPath]]),
    );

    expect(
      mapSourcePosition(cache, {column: 0, line: 2, source: generatedPath}),
    ).toEqual({
      column: 2,
      line: 10,
      name: 'double',
      source: originalPath,
    });
  });

  test('leaves a source that already names a scheme alone', () => {
    mockFileContents(() =>
      JSON.stringify({...decodedMap, sources: ['webpack:///src/input.ts']}),
    );

    const cache = new SourceMapCache(
      new Map([[generatedPath, registeredMapPath]]),
    );

    expect(
      mapSourcePosition(cache, {column: 0, line: 2, source: generatedPath}),
    ).toEqual({
      column: 2,
      line: 10,
      name: 'double',
      source: 'webpack:///src/input.ts',
    });
  });

  test('returns the generated position when nothing maps to it', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const cache = new SourceMapCache(
      new Map([[generatedPath, registeredMapPath]]),
    );
    const generated = {column: 4, line: 40, source: generatedPath};

    expect(mapSourcePosition(cache, generated)).toBe(generated);
  });

  test('returns the generated position when there is no map', () => {
    mockFileContents(() => 'code();');

    const cache = new SourceMapCache(new Map());
    const generated = {column: 0, line: 2, source: generatedPath};

    expect(mapSourcePosition(cache, generated)).toBe(generated);
  });
});
