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
// source of a mapping comes back with backslashes.
const buildDir = path.resolve(path.sep, 'repo', 'build');
const generatedPath = path.join(buildDir, 'out.js');
const adjacentMapPath = path.join(buildDir, 'out.js.map');
const originalPath = path.join(buildDir, 'input.ts');
const registeredMapPath = path.resolve(path.sep, 'cache', 'out.js.map');

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
