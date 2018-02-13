/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const path = require('path');

jest.mock('fb-watchman', () => {
  const normalizePathSep = require('../../lib/normalize_path_sep').default;
  const Client = jest.fn();
  Client.prototype.command = jest.fn((args, callback) => {
    if (args[0] === 'watch-project') {
      setImmediate(() => callback(null, {watch: args[1].replace(/\\/g, '/')}));
    } else if (args[0] === 'query') {
      setImmediate(() =>
        callback(null, mockResponse[normalizePathSep(args[1])]),
      );
    }
  });
  Client.prototype.on = jest.fn();
  Client.prototype.end = jest.fn();
  return {Client};
});

const pearMatcher = path => /pear/.test(path);

let watchmanCrawl;
let mockResponse;
let mockFiles;

const FRUITS = path.sep + 'fruits';
const VEGETABLES = path.sep + 'vegetables';
const ROOTS = [FRUITS, VEGETABLES];
const BANANA = path.join(FRUITS, 'banana.js');
const STRAWBERRY = path.join(FRUITS, 'strawberry.js');
const KIWI = path.join(FRUITS, 'kiwi.js');
const TOMATO = path.join(FRUITS, 'tomato.js');
const MELON = path.join(VEGETABLES, 'melon.json');

describe('watchman watch', () => {
  beforeEach(() => {
    watchmanCrawl = require('../watchman');

    mockResponse = {
      [FRUITS]: {
        clock: 'c:fake-clock:1',
        files: [
          {
            exists: true,
            mtime_ms: {toNumber: () => 30},
            name: 'strawberry.js',
          },
          {
            exists: true,
            mtime_ms: {toNumber: () => 31},
            name: 'tomato.js',
          },
          {
            exists: true,
            mtime_ms: {toNumber: () => 32},
            name: 'pear.js',
          },
        ],
        is_fresh_instance: true,
        version: '4.5.0',
      },
      [VEGETABLES]: {
        clock: 'c:fake-clock:2',
        files: [
          {
            exists: true,
            mtime_ms: {toNumber: () => 33},
            name: 'melon.json',
          },
        ],
        is_fresh_instance: true,
        version: '4.5.0',
      },
    };

    mockFiles = Object.assign(Object.create(null), {
      [MELON]: ['', 33, 0, []],
      [STRAWBERRY]: ['', 30, 0, []],
      [TOMATO]: ['', 31, 0, []],
    });
  });

  it('returns a list of all files when there are no clocks', () => {
    const watchman = require('fb-watchman');
    const normalizePathSep = require('../../lib/normalize_path_sep').default;

    const originalPathRelative = path.relative;
    const ROOT_MOCK = path.sep === '/' ? '/root-mock' : 'M:\\root-mock';
    path.relative = jest.fn(from => normalizePathSep(ROOT_MOCK + from));

    return watchmanCrawl({
      data: {
        clocks: Object.create(null),
        files: Object.create(null),
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      roots: ROOTS,
    }).then(data => {
      const client = watchman.Client.mock.instances[0];
      const calls = client.command.mock.calls;

      expect(client.on).toBeCalled();
      expect(client.on).toBeCalledWith('error', expect.any(Function));

      // Call 0 and 1 are for ['watch-project']
      expect(calls[0][0][0]).toEqual('watch-project');
      expect(calls[1][0][0]).toEqual('watch-project');

      // Calls 2 and 3 are queries
      const query1 = calls[2][0];
      const query2 = calls[3][0];
      expect(query1[0]).toEqual('query');
      expect(query2[0]).toEqual('query');

      expect(query1[2].expression).toEqual([
        'allof',
        ['type', 'f'],
        ['anyof', ['suffix', 'js'], ['suffix', 'json']],
        ['anyof', ['dirname', ROOT_MOCK + FRUITS]],
      ]);
      expect(query2[2].expression).toEqual([
        'allof',
        ['type', 'f'],
        ['anyof', ['suffix', 'js'], ['suffix', 'json']],
        ['anyof', ['dirname', ROOT_MOCK + VEGETABLES]],
      ]);

      expect(query1[2].fields).toEqual(['name', 'exists', 'mtime_ms']);
      expect(query2[2].fields).toEqual(['name', 'exists', 'mtime_ms']);

      expect(query1[2].suffix).toEqual(['js', 'json']);
      expect(query2[2].suffix).toEqual(['js', 'json']);

      expect(data.clocks).toEqual({
        [FRUITS]: 'c:fake-clock:1',
        [VEGETABLES]: 'c:fake-clock:2',
      });

      expect(data.files).toEqual(mockFiles);

      path.relative = originalPathRelative;

      expect(client.end).toBeCalled();
    });
  });

  it('updates the file object when the clock is given', () => {
    mockResponse = {
      [FRUITS]: {
        clock: 'c:fake-clock:3',
        files: [
          {
            exists: true,
            mtime_ms: {toNumber: () => 42},
            name: 'kiwi.js',
          },
          {
            exists: false,
            mtime_ms: null,
            name: 'tomato.js',
          },
        ],
        is_fresh_instance: false,
        version: '4.5.0',
      },
      [VEGETABLES]: {
        clock: 'c:fake-clock:4',
        files: [],
        version: '4.5.0',
      },
    };

    const clocks = Object.assign(Object.create(null), {
      [FRUITS]: 'c:fake-clock:1',
      [VEGETABLES]: 'c:fake-clock:2',
    });

    return watchmanCrawl({
      data: {
        clocks,
        files: mockFiles,
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      roots: ROOTS,
    }).then(data => {
      // The object was reused.
      expect(data.files).toBe(mockFiles);

      expect(data.clocks).toEqual({
        [FRUITS]: 'c:fake-clock:3',
        [VEGETABLES]: 'c:fake-clock:4',
      });

      expect(data.files).toEqual({
        [KIWI]: ['', 42, 0, []],
        [MELON]: ['', 33, 0, []],
        [STRAWBERRY]: ['', 30, 0, []],
      });
    });
  });

  it('resets the file object when watchman is restarted', () => {
    mockResponse = {
      [FRUITS]: {
        clock: 'c:fake-clock:5',
        files: [
          {
            exists: true,
            mtime_ms: {toNumber: () => 42},
            name: 'kiwi.js',
          },
          {
            exists: true,
            mtime_ms: {toNumber: () => 41},
            name: 'banana.js',
          },
          {
            exists: true,
            mtime_ms: {toNumber: () => 31},
            name: 'tomato.js',
          },
        ],
        is_fresh_instance: true,
        version: '4.5.0',
      },
      [VEGETABLES]: {
        clock: 'c:fake-clock:6',
        files: [],
        is_fresh_instance: true,
        version: '4.5.0',
      },
    };

    const mockMetadata = ['Banana', 41, 1, ['Raspberry']];
    mockFiles[BANANA] = mockMetadata;

    const clocks = Object.assign(Object.create(null), {
      [FRUITS]: 'c:fake-clock:1',
      [VEGETABLES]: 'c:fake-clock:2',
    });

    return watchmanCrawl({
      data: {
        clocks,
        files: mockFiles,
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      roots: ROOTS,
    }).then(data => {
      // The file object was *not* reused.
      expect(data.files).not.toBe(mockFiles);

      expect(data.clocks).toEqual({
        [FRUITS]: 'c:fake-clock:5',
        [VEGETABLES]: 'c:fake-clock:6',
      });

      // /fruits/strawberry.js was removed from the file list.
      expect(data.files).toEqual({
        [BANANA]: mockMetadata,
        [KIWI]: ['', 42, 0, []],
        [TOMATO]: mockFiles[TOMATO],
      });

      // Even though the file list was reset, old file objects are still reused
      // if no changes have been made.
      expect(data.files[BANANA]).toBe(mockMetadata);

      expect(data.files[TOMATO]).toBe(mockFiles[TOMATO]);
    });
  });

  it('properly resets the file map when only one watcher is reset', () => {
    mockResponse = {
      [FRUITS]: {
        clock: 'c:fake-clock:3',
        files: [
          {
            exists: true,
            mtime_ms: {toNumber: () => 42},
            name: 'kiwi.js',
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
          },
        ],
        is_fresh_instance: true,
        version: '4.5.0',
      },
    };

    const clocks = Object.assign(Object.create(null), {
      [FRUITS]: 'c:fake-clock:1',
      [VEGETABLES]: 'c:fake-clock:2',
    });

    return watchmanCrawl({
      data: {
        clocks,
        files: mockFiles,
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      roots: ROOTS,
    }).then(data => {
      expect(data.clocks).toEqual({
        [FRUITS]: 'c:fake-clock:3',
        [VEGETABLES]: 'c:fake-clock:4',
      });

      expect(data.files).toEqual({
        [KIWI]: ['', 42, 0, []],
        [MELON]: ['', 33, 0, []],
      });
    });
  });
});
