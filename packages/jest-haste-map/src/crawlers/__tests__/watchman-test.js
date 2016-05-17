/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.unmock('../../constants')
  .unmock('../watchman');

jest.mock('fb-watchman', () => {
  const Client = jest.fn();
  Client.prototype.command = jest.fn((args, callback) => {
    if (args[0] === 'watch-project') {
      setTimeout(() => callback(null, {watch: args[1]}), 0);
    } else if (args[0] === 'query') {
      setTimeout(() => callback(null, mockResponse[args[1]]), 0);
    }
    jest.runAllTimers();
  });
  Client.prototype.on = jest.fn();
  Client.prototype.end = jest.fn();
  return {Client};
});

const pearMatcher = path => /pear/.test(path);

let watchmanCrawl;
let mockResponse;
let mockFiles;

describe('watchman watch', () => {

  beforeEach(() => {
    watchmanCrawl = require('../watchman');

    mockResponse = {
      '/fruits': {
        version: '4.5.0',
        clock: 'c:fake-clock:1',
        is_fresh_instance: true,
        files: [
          {
            name: 'strawberry.js',
            exists: true,
            mtime_ms: {toNumber: () => 30},
          },
          {
            name: 'tomato.js',
            exists: true,
            mtime_ms: {toNumber: () => 31},
          },
          {
            name: 'pear.js',
            exists: true,
            mtime_ms: {toNumber: () => 32},
          },
        ],
      },
      '/vegetables': {
        version: '4.5.0',
        clock: 'c:fake-clock:2',
        is_fresh_instance: true,
        files: [
          {
            name: 'melon.json',
            exists: true,
            mtime_ms: {toNumber: () => 33},
          },
        ],
      },
    };

    mockFiles = Object.assign(Object.create(null), {
      '/fruits/strawberry.js': ['', 30, 0, []],
      '/fruits/tomato.js': ['', 31, 0, []],
      '/vegetables/melon.json': ['', 33, 0, []],
    });
  });

  it('returns a list of all files when there are no clocks', () => {
    const watchman = require('fb-watchman');

    const path = require('../../fastpath');
    const originalPathRelative = path.relative;
    path.relative = jest.fn(from => '/root-mock' + from);

    return watchmanCrawl(
      ['/fruits', '/vegetables'],
      ['js', 'json'],
      pearMatcher,
      {
        clocks: Object.create(null),
        files: Object.create(null),
      }
    ).then(data => {
      const client = watchman.Client.mock.instances[0];
      const calls = client.command.mock.calls;

      expect(client.on).toBeCalled();
      expect(client.on).toBeCalledWith('error', jasmine.any(Function));

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
        ['anyof', ['dirname', '/root-mock/fruits']],
      ]);
      expect(query2[2].expression).toEqual([
        'allof',
        ['type', 'f'],
        ['anyof', ['suffix', 'js'], ['suffix', 'json']],
        ['anyof', ['dirname', '/root-mock/vegetables']],
      ]);

      expect(query1[2].fields).toEqual(['name', 'exists', 'mtime_ms']);
      expect(query2[2].fields).toEqual(['name', 'exists', 'mtime_ms']);

      expect(query1[2].suffix).toEqual(['js', 'json']);
      expect(query2[2].suffix).toEqual(['js', 'json']);

      expect(data.clocks).toEqual({
        '/fruits': 'c:fake-clock:1',
        '/vegetables': 'c:fake-clock:2',
      });

      expect(data.files).toEqual(mockFiles);

      path.relative = originalPathRelative;

      expect(client.end).toBeCalled();
    });
  });

  it('updates the file object when the clock is given', () => {
    mockResponse = {
      '/fruits': {
        version: '4.5.0',
        clock: 'c:fake-clock:3',
        is_fresh_instance: false,
        files: [
          {
            name: 'kiwi.js',
            exists: true,
            mtime_ms: {toNumber: () => 42},
          },
          {
            name: 'tomato.js',
            exists: false,
            mtime_ms: null,
          },
        ],
      },
      '/vegetables': {
        version: '4.5.0',
        clock: 'c:fake-clock:4',
        files: [],
      },
    };

    const clocks = Object.assign(Object.create(null), {
      '/fruits': 'c:fake-clock:1',
      '/vegetables': 'c:fake-clock:2',
    });

    return watchmanCrawl(
      ['/fruits', '/vegetables'],
      ['js', 'json'],
      pearMatcher,
      {
        clocks,
        files: mockFiles,
      }
    ).then(data => {
      // The object was reused.
      expect(data.files).toBe(mockFiles);

      expect(data.clocks).toEqual({
        '/fruits': 'c:fake-clock:3',
        '/vegetables': 'c:fake-clock:4',
      });

      expect(data.files).toEqual({
        '/fruits/strawberry.js': ['', 30, 0, []],
        '/fruits/kiwi.js': ['', 42, 0, []],
        '/vegetables/melon.json': ['', 33, 0, []],
      });
    });
  });

  it('resets the file object when watchman is restarted', () => {
    mockResponse = {
      '/fruits': {
        version: '4.5.0',
        clock: 'c:fake-clock:5',
        is_fresh_instance: true,
        files: [
          {
            name: 'kiwi.js',
            exists: true,
            mtime_ms: {toNumber: () => 42},
          },
          {
            name: 'banana.js',
            exists: true,
            mtime_ms: {toNumber: () => 41},
          },
          {
            name: 'tomato.js',
            exists: true,
            mtime_ms: {toNumber: () => 31},
          },
        ],
      },
      '/vegetables': {
        version: '4.5.0',
        clock: 'c:fake-clock:6',
        is_fresh_instance: true,
        files: [],
      },
    };

    const mockMetadata = ['Banana', 41, 1, ['Raspberry']];
    mockFiles['/fruits/banana.js'] = mockMetadata;

    const clocks = Object.assign(Object.create(null), {
      '/fruits': 'c:fake-clock:1',
      '/vegetables': 'c:fake-clock:2',
    });

    return watchmanCrawl(
      ['/fruits', '/vegetables'],
      ['js', 'json'],
      pearMatcher,
      {
        clocks,
        files: mockFiles,
      }
    ).then(data => {
      // The file object was *not* reused.
      expect(data.files).not.toBe(mockFiles);

      expect(data.clocks).toEqual({
        '/fruits': 'c:fake-clock:5',
        '/vegetables': 'c:fake-clock:6',
      });

      // /fruits/strawberry.js was removed from the file list.
      expect(data.files).toEqual({
        '/fruits/kiwi.js': ['', 42, 0, []],
        '/fruits/banana.js': mockMetadata,
        '/fruits/tomato.js': mockFiles['/fruits/tomato.js'],
      });

      // Even though the file list was reset, old file objects are still reused
      // if no changes have been made.
      expect(data.files['/fruits/banana.js']).toBe(mockMetadata);

      expect(data.files['/fruits/tomato.js'])
        .toBe(mockFiles['/fruits/tomato.js']);
    });
  });

  it('properly resets the file map when only one watcher is reset', () => {
    mockResponse = {
      '/fruits': {
        version: '4.5.0',
        clock: 'c:fake-clock:3',
        is_fresh_instance: false,
        files: [
          {
            name: 'kiwi.js',
            exists: true,
            mtime_ms: {toNumber: () => 42},
          },
        ],
      },
      '/vegetables': {
        version: '4.5.0',
        clock: 'c:fake-clock:4',
        is_fresh_instance: true,
        files: [
          {
            name: 'melon.json',
            exists: true,
            mtime_ms: {toNumber: () => 33},
          },
        ],
      },
    };

    const clocks = Object.assign(Object.create(null), {
      '/fruits': 'c:fake-clock:1',
      '/vegetables': 'c:fake-clock:2',
    });

    return watchmanCrawl(
      ['/fruits', '/vegetables'],
      ['js', 'json'],
      pearMatcher,
      {
        clocks,
        files: mockFiles,
      }
    ).then(data => {
      expect(data.clocks).toEqual({
        '/fruits': 'c:fake-clock:3',
        '/vegetables': 'c:fake-clock:4',
      });

      expect(data.files).toEqual({
        '/fruits/kiwi.js': ['', 42, 0, []],
        '/vegetables/melon.json': ['', 33, 0, []],
      });
    });
  });

});
