/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const path = require('path');

jest.mock('fb-watchman', () => {
  const normalizePathSep = require('../../lib/normalizePathSep').default;
  const Client = jest.fn();
  Client.prototype.capabilityCheck = jest.fn((args, callback) =>
    setImmediate(() => {
      callback(null, {
        capabilities: {'suffix-set': true},
        version: '2021.06.07.00',
      });
    }),
  );
  Client.prototype.command = jest.fn((args, callback) =>
    setImmediate(() => {
      const path = args[1] ? normalizePathSep(args[1]) : undefined;
      const response = mockResponse[args[0]][path];
      callback(null, response.next ? response.next().value : response);
    }),
  );
  Client.prototype.on = jest.fn();
  Client.prototype.end = jest.fn();
  return {Client};
});

const forcePOSIXPaths = path => path.replaceAll('\\', '/');
const pearMatcher = path => /pear/.test(path);

let watchman;
let watchmanCrawl;
let mockResponse;
let mockFiles;

const ROOT_MOCK = path.sep === '/' ? '/root-mock' : 'M:\\root-mock';
const FRUITS_RELATIVE = 'fruits';
const VEGETABLES_RELATIVE = 'vegetables';
const FRUITS = path.resolve(ROOT_MOCK, FRUITS_RELATIVE);
const VEGETABLES = path.resolve(ROOT_MOCK, VEGETABLES_RELATIVE);
const ROOTS = [FRUITS, VEGETABLES];
const BANANA_RELATIVE = path.join(FRUITS_RELATIVE, 'banana.js');
const STRAWBERRY_RELATIVE = path.join(FRUITS_RELATIVE, 'strawberry.js');
const KIWI_RELATIVE = path.join(FRUITS_RELATIVE, 'kiwi.js');
const TOMATO_RELATIVE = path.join(FRUITS_RELATIVE, 'tomato.js');
const MELON_RELATIVE = path.join(VEGETABLES_RELATIVE, 'melon.json');

const WATCH_PROJECT_MOCK = {
  [FRUITS]: {
    relative_path: 'fruits',
    watch: forcePOSIXPaths(ROOT_MOCK),
  },
  [VEGETABLES]: {
    relative_path: 'vegetables',
    watch: forcePOSIXPaths(ROOT_MOCK),
  },
};

const createMap = obj => new Map(Object.keys(obj).map(key => [key, obj[key]]));

describe('watchman watch', () => {
  beforeEach(() => {
    watchmanCrawl = require('../watchman').watchmanCrawl;

    watchman = require('fb-watchman');

    mockResponse = {
      'list-capabilities': {
        [undefined]: {
          capabilities: ['field-content.sha1hex'],
        },
      },
      query: {
        [ROOT_MOCK]: {
          clock: 'c:fake-clock:1',
          files: [
            {
              exists: true,
              mtime_ms: {toNumber: () => 30},
              name: 'fruits/strawberry.js',
              size: 40,
            },
            {
              exists: true,
              mtime_ms: {toNumber: () => 31},
              name: 'fruits/tomato.js',
              size: 41,
            },
            {
              exists: true,
              mtime_ms: {toNumber: () => 32},
              name: 'fruits/pear.js',
              size: 42,
            },
            {
              exists: true,
              mtime_ms: {toNumber: () => 33},
              name: 'vegetables/melon.json',
              size: 43,
            },
          ],
          is_fresh_instance: true,
          version: '4.5.0',
        },
      },
      'watch-project': WATCH_PROJECT_MOCK,
    };

    mockFiles = createMap({
      [MELON_RELATIVE]: ['', 33, 43, 0, '', null],
      [STRAWBERRY_RELATIVE]: ['', 30, 40, 0, '', null],
      [TOMATO_RELATIVE]: ['', 31, 41, 0, '', null],
    });
  });

  afterEach(() => {
    watchman.Client.mock.instances[0].command.mockClear();
  });

  test('returns a list of all files when there are no clocks', async () => {
    const {changedFiles, hasteMap, removedFiles} = await watchmanCrawl({
      data: {
        clocks: new Map(),
        files: new Map(),
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir: ROOT_MOCK,
      roots: ROOTS,
    });
    const client = watchman.Client.mock.instances[0];
    const calls = client.command.mock.calls;

    expect(client.on).toHaveBeenCalled();
    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));

    // Call 0 and 1 are for ['watch-project']
    expect(calls[0][0][0]).toBe('watch-project');
    expect(calls[1][0][0]).toBe('watch-project');

    // Call 2 is the query
    const query = calls[2][0];
    expect(query[0]).toBe('query');

    expect(query[2].expression).toEqual([
      'allof',
      ['type', 'f'],
      ['suffix', ['js', 'json']],
      ['anyof', ['dirname', 'fruits'], ['dirname', 'vegetables']],
    ]);

    expect(query[2].fields).toEqual(['name', 'exists', 'mtime_ms', 'size']);

    expect(query[2].glob).toEqual([
      'fruits/**/*.js',
      'fruits/**/*.json',
      'vegetables/**/*.js',
      'vegetables/**/*.json',
    ]);

    expect(hasteMap.clocks).toEqual(
      createMap({
        '': 'c:fake-clock:1',
      }),
    );

    expect(changedFiles).toBeUndefined();

    expect(hasteMap.files).toEqual(mockFiles);

    expect(removedFiles).toEqual(new Map());

    expect(client.end).toHaveBeenCalled();
  });

  test('updates file map and removedFiles when the clock is given', async () => {
    mockResponse = {
      'list-capabilities': {
        [undefined]: {
          capabilities: ['field-content.sha1hex'],
        },
      },
      query: {
        [ROOT_MOCK]: {
          clock: 'c:fake-clock:2',
          files: [
            {
              exists: true,
              mtime_ms: {toNumber: () => 42},
              name: 'fruits/kiwi.js',
              size: 40,
            },
            {
              exists: false,
              mtime_ms: null,
              name: 'fruits/tomato.js',
              size: 0,
            },
          ],
          is_fresh_instance: false,
          version: '4.5.0',
        },
      },
      'watch-project': WATCH_PROJECT_MOCK,
    };

    const clocks = createMap({
      '': 'c:fake-clock:1',
    });

    const {changedFiles, hasteMap, removedFiles} = await watchmanCrawl({
      data: {
        clocks,
        files: mockFiles,
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir: ROOT_MOCK,
      roots: ROOTS,
    });

    // The object was reused.
    expect(hasteMap.files).toBe(mockFiles);

    expect(hasteMap.clocks).toEqual(
      createMap({
        '': 'c:fake-clock:2',
      }),
    );

    expect(changedFiles).toEqual(
      createMap({
        [KIWI_RELATIVE]: ['', 42, 40, 0, '', null],
      }),
    );

    expect(hasteMap.files).toEqual(
      createMap({
        [KIWI_RELATIVE]: ['', 42, 40, 0, '', null],
        [MELON_RELATIVE]: ['', 33, 43, 0, '', null],
        [STRAWBERRY_RELATIVE]: ['', 30, 40, 0, '', null],
      }),
    );

    expect(removedFiles).toEqual(
      createMap({
        [TOMATO_RELATIVE]: ['', 31, 41, 0, '', null],
      }),
    );
  });

  test('resets the file map and tracks removedFiles when watchman is fresh', async () => {
    const mockTomatoSha1 = '321f6b7e8bf7f29aab89c5e41a555b1b0baa41a9';

    mockResponse = {
      'list-capabilities': {
        [undefined]: {
          capabilities: ['field-content.sha1hex'],
        },
      },
      query: {
        [ROOT_MOCK]: {
          clock: 'c:fake-clock:3',
          files: [
            {
              exists: true,
              mtime_ms: {toNumber: () => 42},
              name: 'fruits/kiwi.js',
              size: 52,
            },
            {
              exists: true,
              mtime_ms: {toNumber: () => 41},
              name: 'fruits/banana.js',
              size: 51,
            },
            {
              'content.sha1hex': mockTomatoSha1,
              exists: true,
              mtime_ms: {toNumber: () => 76},
              name: 'fruits/tomato.js',
              size: 41,
            },
          ],
          is_fresh_instance: true,
          version: '4.5.0',
        },
      },
      'watch-project': WATCH_PROJECT_MOCK,
    };

    const mockBananaMetadata = ['Banana', 41, 51, 1, ['Raspberry'], null];
    mockFiles.set(BANANA_RELATIVE, mockBananaMetadata);
    const mockTomatoMetadata = ['Tomato', 31, 41, 1, [], mockTomatoSha1];
    mockFiles.set(TOMATO_RELATIVE, mockTomatoMetadata);

    const clocks = createMap({
      '': 'c:fake-clock:1',
    });

    const {changedFiles, hasteMap, removedFiles} = await watchmanCrawl({
      data: {
        clocks,
        files: mockFiles,
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir: ROOT_MOCK,
      roots: ROOTS,
    });

    // The file object was *not* reused.
    expect(hasteMap.files).not.toBe(mockFiles);

    expect(hasteMap.clocks).toEqual(
      createMap({
        '': 'c:fake-clock:3',
      }),
    );

    expect(changedFiles).toBeUndefined();

    // strawberry and melon removed from the file list.
    expect(hasteMap.files).toEqual(
      createMap({
        [BANANA_RELATIVE]: mockBananaMetadata,
        [KIWI_RELATIVE]: ['', 42, 52, 0, '', null],
        [TOMATO_RELATIVE]: ['Tomato', 76, 41, 1, [], mockTomatoSha1],
      }),
    );

    // Even though the file list was reset, old file objects are still reused
    // if no changes have been made
    expect(hasteMap.files.get(BANANA_RELATIVE)).toBe(mockBananaMetadata);

    // Old file objects are not reused if they have a different mtime
    expect(hasteMap.files.get(TOMATO_RELATIVE)).not.toBe(mockTomatoMetadata);

    expect(removedFiles).toEqual(
      createMap({
        [MELON_RELATIVE]: ['', 33, 43, 0, '', null],
        [STRAWBERRY_RELATIVE]: ['', 30, 40, 0, '', null],
      }),
    );
  });

  test('properly resets the file map when only one watcher is reset', async () => {
    mockResponse = {
      'list-capabilities': {
        [undefined]: {
          capabilities: ['field-content.sha1hex'],
        },
      },
      query: {
        [FRUITS]: {
          clock: 'c:fake-clock:3',
          files: [
            {
              exists: true,
              mtime_ms: {toNumber: () => 42},
              name: 'kiwi.js',
              size: 52,
            },
          ],
          is_fresh_instance: false,
          version: '4.5.0',
        },
        [VEGETABLES]: {
          clock: 'c:fake-clock:4',
          files: [
            {
              exists: true,
              mtime_ms: {toNumber: () => 33},
              name: 'melon.json',
              size: 43,
            },
          ],
          is_fresh_instance: true,
          version: '4.5.0',
        },
      },
      'watch-project': {
        [FRUITS]: {
          watch: forcePOSIXPaths(FRUITS),
        },
        [VEGETABLES]: {
          watch: forcePOSIXPaths(VEGETABLES),
        },
      },
    };

    const clocks = createMap({
      [FRUITS_RELATIVE]: 'c:fake-clock:1',
      [VEGETABLES_RELATIVE]: 'c:fake-clock:2',
    });

    const {changedFiles, hasteMap, removedFiles} = await watchmanCrawl({
      data: {
        clocks,
        files: mockFiles,
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir: ROOT_MOCK,
      roots: ROOTS,
    });

    expect(hasteMap.clocks).toEqual(
      createMap({
        [FRUITS_RELATIVE]: 'c:fake-clock:3',
        [VEGETABLES_RELATIVE]: 'c:fake-clock:4',
      }),
    );

    expect(changedFiles).toBeUndefined();

    expect(hasteMap.files).toEqual(
      createMap({
        [KIWI_RELATIVE]: ['', 42, 52, 0, '', null],
        [MELON_RELATIVE]: ['', 33, 43, 0, '', null],
      }),
    );

    expect(removedFiles).toEqual(
      createMap({
        [STRAWBERRY_RELATIVE]: ['', 30, 40, 0, '', null],
        [TOMATO_RELATIVE]: ['', 31, 41, 0, '', null],
      }),
    );
  });

  test('does not add directory filters to query when watching a ROOT', async () => {
    mockResponse = {
      'list-capabilities': {
        [undefined]: {
          capabilities: ['field-content.sha1hex'],
        },
      },
      query: {
        [ROOT_MOCK]: {
          clock: 'c:fake-clock:1',
          files: [],
          is_fresh_instance: false,
          version: '4.5.0',
        },
      },
      'watch-project': {
        [FRUITS]: {
          relative_path: 'fruits',
          watch: forcePOSIXPaths(ROOT_MOCK),
        },
        [ROOT_MOCK]: {
          watch: forcePOSIXPaths(ROOT_MOCK),
        },
        [VEGETABLES]: {
          relative_path: 'vegetables',
          watch: forcePOSIXPaths(ROOT_MOCK),
        },
      },
    };

    const {changedFiles, hasteMap, removedFiles} = await watchmanCrawl({
      data: {
        clocks: new Map(),
        files: new Map(),
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir: ROOT_MOCK,
      roots: [...ROOTS, ROOT_MOCK],
    });

    const client = watchman.Client.mock.instances[0];
    const calls = client.command.mock.calls;

    expect(client.on).toHaveBeenCalled();
    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));

    // First 3 calls are for ['watch-project']
    expect(calls[0][0][0]).toBe('watch-project');
    expect(calls[1][0][0]).toBe('watch-project');
    expect(calls[2][0][0]).toBe('watch-project');

    // Call 4 is the query
    const query = calls[3][0];
    expect(query[0]).toBe('query');

    expect(query[2].expression).toEqual([
      'allof',
      ['type', 'f'],
      ['suffix', ['js', 'json']],
    ]);

    expect(query[2].fields).toEqual(['name', 'exists', 'mtime_ms', 'size']);

    expect(query[2].glob).toEqual(['**/*.js', '**/*.json']);

    expect(hasteMap.clocks).toEqual(
      createMap({
        '': 'c:fake-clock:1',
      }),
    );

    expect(changedFiles).toEqual(new Map());

    expect(hasteMap.files).toEqual(new Map());

    expect(removedFiles).toEqual(new Map());

    expect(client.end).toHaveBeenCalled();
  });

  test('SHA-1 requested and available', async () => {
    mockResponse = {
      'list-capabilities': {
        [undefined]: {
          capabilities: ['field-content.sha1hex'],
        },
      },
      query: {
        [ROOT_MOCK]: {
          clock: 'c:fake-clock:1',
          files: [],
          is_fresh_instance: false,
          version: '4.5.0',
        },
      },
      'watch-project': {
        [ROOT_MOCK]: {
          watch: forcePOSIXPaths(ROOT_MOCK),
        },
      },
    };

    await watchmanCrawl({
      computeSha1: true,
      data: {
        clocks: new Map(),
        files: new Map(),
      },
      extensions: ['js', 'json'],
      rootDir: ROOT_MOCK,
      roots: [ROOT_MOCK],
    });

    const client = watchman.Client.mock.instances[0];
    const calls = client.command.mock.calls;

    expect(calls[0][0]).toEqual(['list-capabilities']);
    expect(calls[2][0][2].fields).toContain('content.sha1hex');
  });

  test('SHA-1 requested and NOT available', async () => {
    mockResponse = {
      'list-capabilities': {
        [undefined]: {
          capabilities: [],
        },
      },
      query: {
        [ROOT_MOCK]: {
          clock: 'c:fake-clock:1',
          files: [],
          is_fresh_instance: false,
          version: '4.5.0',
        },
      },
      'watch-project': {
        [ROOT_MOCK]: {
          watch: forcePOSIXPaths(ROOT_MOCK),
        },
      },
    };

    await watchmanCrawl({
      computeSha1: true,
      data: {
        clocks: new Map(),
        files: new Map(),
      },
      extensions: ['js', 'json'],
      rootDir: ROOT_MOCK,
      roots: [ROOT_MOCK],
    });

    const client = watchman.Client.mock.instances[0];
    const calls = client.command.mock.calls;

    expect(calls[0][0]).toEqual(['list-capabilities']);
    expect(calls[2][0][2].fields).not.toContain('content.sha1hex');
  });

  test('source control query', async () => {
    mockResponse = {
      'list-capabilities': {
        [undefined]: {
          capabilities: ['field-content.sha1hex'],
        },
      },
      query: {
        [ROOT_MOCK]: {
          clock: {
            clock: 'c:1608612057:79675:1:139410',
            scm: {
              mergebase: 'master',
              'mergebase-with': 'master',
            },
          },
          files: [
            {
              exists: true,
              mtime_ms: {toNumber: () => 42},
              name: 'fruits/kiwi.js',
              size: 40,
            },
            {
              exists: false,
              mtime_ms: null,
              name: 'fruits/tomato.js',
              size: 0,
            },
          ],
          // Watchman is going to tell us that we have a fresh instance.
          is_fresh_instance: true,
          version: '4.5.0',
        },
      },
      'watch-project': WATCH_PROJECT_MOCK,
    };

    // Start with a source-control clock.
    const clocks = createMap({
      '': {scm: {'mergebase-with': 'master'}},
    });

    const {changedFiles, hasteMap, removedFiles} = await watchmanCrawl({
      data: {
        clocks,
        files: mockFiles,
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir: ROOT_MOCK,
      roots: ROOTS,
    });

    // The object was reused.
    expect(hasteMap.files).toBe(mockFiles);

    // Transformed into a normal clock.
    expect(hasteMap.clocks).toEqual(
      createMap({
        '': 'c:1608612057:79675:1:139410',
      }),
    );

    expect(changedFiles).toEqual(
      createMap({
        [KIWI_RELATIVE]: ['', 42, 40, 0, '', null],
      }),
    );

    expect(hasteMap.files).toEqual(
      createMap({
        [KIWI_RELATIVE]: ['', 42, 40, 0, '', null],
        [MELON_RELATIVE]: ['', 33, 43, 0, '', null],
        [STRAWBERRY_RELATIVE]: ['', 30, 40, 0, '', null],
      }),
    );

    expect(removedFiles).toEqual(
      createMap({
        [TOMATO_RELATIVE]: ['', 31, 41, 0, '', null],
      }),
    );
  });
});
