/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {SourceMapCache, mapSourcePosition} from '../SourceMapCache';
import {nodeFileReader} from '../nodeFileReader';
import type {SourceMapFileReader, SourceMapRegistry} from '../types';

jest.mock('graceful-fs');

// Built with `path` so the expectations survive on Windows, where the resolved
// source of a mapping comes back with backslashes. Both paths are per-test:
// parsed maps are held against the map path plus its base and the map path is remembered
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
const reportUnparsableMock = jest.fn<(map: string, file: string) => void>();

// `readFileSync` is overloaded, so an implementation returning a string does
// not satisfy its type directly.
function mockFileContents(read: (filePath: string) => string) {
  readFileMock.mockImplementation(read as unknown as typeof fs.readFileSync);
}

function createCache(sourceMaps: SourceMapRegistry | null) {
  return new SourceMapCache(sourceMaps, nodeFileReader, reportUnparsableMock);
}

function sourceOf(cache: SourceMapCache) {
  return mapSourcePosition(cache, {column: 0, line: 2, source: generatedPath});
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

    const cache = createCache(new Map([[generatedPath, registeredMapPath]]));

    // The map lives in the transform cache, but its sources are relative to the
    // file that was transformed.
    expect(sourceOf(cache).source).toBe(originalPath);
    expect(readFileMock).toHaveBeenCalledWith(registeredMapPath, 'utf8');
  });

  test('parses each map file only once', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const cache = createCache(new Map([[generatedPath, registeredMapPath]]));
    const first = cache.get(generatedPath);

    expect(cache.get(generatedPath)).toBe(first);
    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  test('caches the absence of a map', () => {
    mockFileContents(() => 'no sourceMappingURL here');

    const cache = createCache(new Map());

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

    const cache = createCache(new Map([[generatedPath, registeredMapPath]]));

    expect(sourceOf(cache)).toEqual({
      column: 2,
      line: 10,
      name: 'double',
      source: originalPath,
    });
  });

  test('re-checks the registry after a miss, since it fills in lazily', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const sourceMaps = new Map<string, string>();
    const cache = createCache(sourceMaps);

    expect(cache.get(generatedPath)).toBeNull();

    sourceMaps.set(generatedPath, registeredMapPath);

    expect(cache.get(generatedPath)).not.toBeNull();
  });

  test('does not retry a registered map that failed to load', () => {
    mockFileContents(() => '{not json');

    const cache = createCache(new Map([[generatedPath, registeredMapPath]]));

    cache.get(generatedPath);
    cache.get(generatedPath);
    cache.get(generatedPath);

    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  test('parses a map once for every file that shares the cache path', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    // Two test files in one worker: different registries, same transform-cache
    // entry, so the map should be read and parsed only once.
    const first = createCache(new Map([[generatedPath, registeredMapPath]]));
    const second = createCache(new Map([[generatedPath, registeredMapPath]]));

    expect(first.get(generatedPath)).not.toBeNull();
    expect(second.get(generatedPath)).not.toBeNull();
    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  // A transformer with its own `getCacheKey` can hand two generated files the
  // same map path: identical files with the same basename, keyed on content.
  test('resolves sources against each generated file sharing a map path', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const otherDir = path.resolve(path.sep, 'repo', `other-${mapPathCounter}`);
    const otherGeneratedPath = path.join(otherDir, 'out.js');
    const cache = createCache(
      new Map([
        [generatedPath, registeredMapPath],
        [otherGeneratedPath, registeredMapPath],
      ]),
    );

    expect(sourceOf(cache).source).toBe(originalPath);
    expect(
      mapSourcePosition(cache, {
        column: 0,
        line: 2,
        source: otherGeneratedPath,
      }).source,
    ).toBe(path.join(otherDir, 'input.ts'));
  });

  // The runtime empties the registry at teardown, and stacks are still
  // formatted after that — a stray timer, a floating promise.
  test('keeps a loaded map after the registry is emptied', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const sourceMaps = new Map([[generatedPath, registeredMapPath]]);
    const cache = createCache(sourceMaps);
    const loaded = cache.get(generatedPath);

    sourceMaps.clear();

    expect(cache.get(generatedPath)).toBe(loaded);
  });

  // A worker runs the next test file while a stray timer from the previous one
  // can still throw, and that frame names a file the new registry never saw.
  test('still resolves a file the current registry has never seen', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const first = createCache(new Map([[generatedPath, registeredMapPath]]));

    expect(first.get(generatedPath)).not.toBeNull();

    expect(createCache(new Map()).get(generatedPath)).not.toBeNull();
  });

  test('declines to guess when a file has been transformed two ways', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const asCjs = createCache(new Map([[generatedPath, registeredMapPath]]));
    const asEsm = createCache(
      new Map([[generatedPath, `${registeredMapPath}.esm`]]),
    );

    expect(asCjs.get(generatedPath)).not.toBeNull();
    expect(asEsm.get(generatedPath)).not.toBeNull();

    // Which of the two produced a late frame is unknowable, so neither answers.
    expect(createCache(new Map()).get(generatedPath)).toBeNull();
  });

  test('survives an unparsable map', () => {
    mockFileContents(() => '{not json');

    const cache = createCache(new Map([[generatedPath, registeredMapPath]]));

    expect(cache.get(generatedPath)).toBeNull();
  });

  test('reports an unparsable map once', () => {
    mockFileContents(() => '{not json');

    createCache(new Map([[generatedPath, registeredMapPath]])).get(
      generatedPath,
    );
    createCache(new Map([[generatedPath, registeredMapPath]])).get(
      generatedPath,
    );

    expect(reportUnparsableMock).toHaveBeenCalledTimes(1);
    expect(reportUnparsableMock).toHaveBeenCalledWith(
      registeredMapPath,
      generatedPath,
    );
  });

  test('reports an inline map that fails to decode', () => {
    mockFileContents(
      () => 'code();\n//# sourceMappingURL=data:application/json;base64,!!!\n',
    );

    createCache(new Map()).get(generatedPath);

    expect(reportUnparsableMock).toHaveBeenCalledWith(
      generatedPath,
      generatedPath,
    );
  });

  test('never touches the filesystem for a scheme-named file', () => {
    const cache = createCache(new Map());

    expect(cache.get('node:internal/modules/cjs/loader')).toBeNull();
    expect(existsSyncMock).not.toHaveBeenCalled();
    expect(readFileMock).not.toHaveBeenCalled();
  });

  test('goes through the injected reader rather than the filesystem', () => {
    const reader: SourceMapFileReader = {
      read: jest.fn((urlOrPath: string) =>
        urlOrPath === registeredMapPath ? JSON.stringify(decodedMap) : null,
      ),
      toPath: jest.fn((url: string) => `native:${url}`),
      toUrl: jest.fn(() => 'app:///build/out.js'),
    };
    const cache = new SourceMapCache(
      new Map([[generatedPath, registeredMapPath]]),
      reader,
      reportUnparsableMock,
    );

    expect(sourceOf(cache).source).toBe('native:app:///build/input.ts');
    expect(reader.read).toHaveBeenCalledWith(registeredMapPath);
    expect(readFileMock).not.toHaveBeenCalled();
  });

  describe('for files the transform pipeline did not map', () => {
    test('reads an inline `data:` sourceMappingURL', () => {
      const inline = Buffer.from(JSON.stringify(decodedMap)).toString('base64');

      mockFileContents(
        () =>
          `code();\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${inline}\n`,
      );

      const cache = createCache(new Map());

      // An inline map's sources resolve against the file carrying it, not
      // against the `data:` URL.
      expect(sourceOf(cache).source).toBe(originalPath);
      expect(readFileMock).toHaveBeenCalledTimes(1);
    });

    test('reads a URI-encoded inline `data:` sourceMappingURL', () => {
      const inline = encodeURIComponent(JSON.stringify(decodedMap));

      mockFileContents(
        () => `code();\n//# sourceMappingURL=data:application/json,${inline}\n`,
      );

      expect(sourceOf(createCache(new Map())).source).toBe(originalPath);
    });

    test('follows a relative sourceMappingURL', () => {
      mockFileContents(filePath =>
        filePath === generatedPath
          ? 'code();\n//# sourceMappingURL=out.js.map\n'
          : JSON.stringify(decodedMap),
      );

      const cache = createCache(new Map());

      expect(sourceOf(cache).source).toBe(originalPath);
      expect(readFileMock).toHaveBeenCalledWith(adjacentMapPath, 'utf8');
    });

    test('picks the last sourceMappingURL in the file', () => {
      mockFileContents(filePath =>
        filePath === generatedPath
          ? '//# sourceMappingURL=from-a-string.map\ncode();\n//# sourceMappingURL=out.js.map\n'
          : JSON.stringify(decodedMap),
      );

      createCache(new Map()).get(generatedPath);

      expect(readFileMock).toHaveBeenCalledWith(adjacentMapPath, 'utf8');
      expect(readFileMock).not.toHaveBeenCalledWith(
        path.join(buildDir, 'from-a-string.map'),
        'utf8',
      );
    });
  });

  // Sources resolve with URL semantics, so anything the URL grammar gives a
  // meaning to has to survive the round trip out to a URL and back to a path.
  describe.each([['a space'], ['a#hash'], ['a+plus']])(
    'in a directory name holding %s',
    segment => {
      test('resolves the source back to a native path', () => {
        const dir = path.resolve(path.sep, 'repo', segment);

        mockFileContents(() => JSON.stringify(decodedMap));

        const cache = new SourceMapCache(
          new Map([[path.join(dir, 'out.js'), registeredMapPath]]),
          nodeFileReader,
          reportUnparsableMock,
        );

        expect(
          mapSourcePosition(cache, {
            column: 0,
            line: 2,
            source: path.join(dir, 'out.js'),
          }).source,
        ).toBe(path.join(dir, 'input.ts'));
      });
    },
  );
});

describe('mapSourcePosition', () => {
  test('translates a mapped position and resolves the source next to the map', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const cache = createCache(new Map([[generatedPath, registeredMapPath]]));

    expect(sourceOf(cache)).toEqual({
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

    const cache = createCache(new Map([[generatedPath, registeredMapPath]]));

    expect(sourceOf(cache)).toEqual({
      column: 2,
      line: 10,
      name: 'double',
      source: 'webpack:///src/input.ts',
    });
  });

  test('honours `sourceRoot`', () => {
    mockFileContents(() =>
      JSON.stringify({...decodedMap, sourceRoot: '../src'}),
    );

    const cache = createCache(new Map([[generatedPath, registeredMapPath]]));

    expect(sourceOf(cache).source).toBe(
      path.resolve(buildDir, '..', 'src', 'input.ts'),
    );
  });

  test('returns the generated position when nothing maps to it', () => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const cache = createCache(new Map([[generatedPath, registeredMapPath]]));
    const generated = {column: 4, line: 40, source: generatedPath};

    expect(mapSourcePosition(cache, generated)).toBe(generated);
  });

  // The tracer throws on out-of-range needles, which inside `prepareStackTrace`
  // would replace the whole stack with the exception.
  test.each([
    ['a negative column', {column: -1, line: 2}],
    ['line zero', {column: 0, line: 0}],
  ])('returns the generated position for %s', (_label, needle) => {
    mockFileContents(() => JSON.stringify(decodedMap));

    const cache = createCache(new Map([[generatedPath, registeredMapPath]]));
    const generated = {...needle, source: generatedPath};

    expect(mapSourcePosition(cache, generated)).toBe(generated);
  });

  test('returns the generated position when there is no map', () => {
    mockFileContents(() => 'code();');

    const cache = createCache(new Map());
    const generated = {column: 0, line: 2, source: generatedPath};

    expect(mapSourcePosition(cache, generated)).toBe(generated);
  });
});
