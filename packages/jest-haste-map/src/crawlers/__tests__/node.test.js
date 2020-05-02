/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import {skipSuiteOnWindows} from '@jest/test-utils';

jest.mock('child_process', () => ({
  spawn: jest.fn((cmd, args) => {
    let closeCallback;
    return {
      stdout: {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'data') {
            setTimeout(() => {
              callback(mockResponse);
              setTimeout(closeCallback, 0);
            }, 0);
          } else if (event === 'close') {
            closeCallback = callback;
          }
        }),
        setEncoding: jest.fn(),
      },
    };
  }),
}));

let mockHasReaddirWithFileTypesSupport = false;

jest.mock('graceful-fs', () => {
  let mtime = 32;
  const size = 42;
  const stat = (path, callback) => {
    setTimeout(
      () =>
        callback(null, {
          isDirectory() {
            return path.endsWith('/directory');
          },
          isSymbolicLink() {
            return path.endsWith('symlink');
          },
          mtime: {
            getTime() {
              return mtime++;
            },
          },
          size,
        }),
      0,
    );
  };
  return {
    lstat: jest.fn(stat),
    readdir: jest.fn((dir, options, callback) => {
      // readdir has an optional `options` arg that's in the middle of the args list.
      // we always provide it in practice, but let's try to handle the case where it's not
      // provided too
      if (typeof callback === 'undefined') {
        if (typeof options === 'function') {
          callback = options;
        }
        throw new Error('readdir: callback is not a function!');
      }

      if (mockHasReaddirWithFileTypesSupport) {
        if (dir === '/project/fruits') {
          setTimeout(
            () =>
              callback(null, [
                {
                  isDirectory: () => true,
                  isSymbolicLink: () => false,
                  name: 'directory',
                },
                {
                  isDirectory: () => false,
                  isSymbolicLink: () => false,
                  name: 'tomato.js',
                },
                {
                  isDirectory: () => false,
                  isSymbolicLink: () => true,
                  name: 'symlink',
                },
              ]),
            0,
          );
        } else if (dir === '/project/fruits/directory') {
          setTimeout(
            () =>
              callback(null, [
                {
                  isDirectory: () => false,
                  isSymbolicLink: () => false,
                  name: 'strawberry.js',
                },
              ]),
            0,
          );
        } else if (dir == '/error') {
          setTimeout(() => callback({code: 'ENOTDIR'}, undefined), 0);
        }
      } else {
        if (dir === '/project/fruits') {
          setTimeout(
            () => callback(null, ['directory', 'tomato.js', 'symlink']),
            0,
          );
        } else if (dir === '/project/fruits/directory') {
          setTimeout(() => callback(null, ['strawberry.js']), 0);
        } else if (dir == '/error') {
          setTimeout(() => callback({code: 'ENOTDIR'}, undefined), 0);
        }
      }
    }),
    stat: jest.fn(stat),
  };
});

jest.mock('which', () => jest.fn().mockResolvedValue());

const pearMatcher = path => /pear/.test(path);
const createMap = obj => new Map(Object.keys(obj).map(key => [key, obj[key]]));

const rootDir = '/project';
let mockResponse;
let nodeCrawl;
let childProcess;

describe('node crawler', () => {
  skipSuiteOnWindows();

  beforeEach(() => {
    jest.resetModules();

    // Remove the "process.platform" property descriptor so it can be writable.
    delete process.platform;

    mockResponse = [
      '/project/fruits/pear.js',
      '/project/fruits/strawberry.js',
      '/project/fruits/tomato.js',
    ].join('\n');
  });

  it('crawls for files based on patterns', () => {
    process.platform = 'linux';

    childProcess = require('child_process');
    nodeCrawl = require('../node');

    mockResponse = [
      '/project/fruits/pear.js',
      '/project/fruits/strawberry.js',
      '/project/fruits/tomato.js',
      '/project/vegetables/melon.json',
    ].join('\n');

    const promise = nodeCrawl({
      data: {
        files: new Map(),
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits', '/project/vegtables'],
    }).then(({hasteMap, removedFiles}) => {
      expect(childProcess.spawn).lastCalledWith('find', [
        '/project/fruits',
        '/project/vegtables',
        '-type',
        'f',
        '(',
        '-iname',
        '*.js',
        '-o',
        '-iname',
        '*.json',
        ')',
      ]);

      expect(hasteMap.files).not.toBe(null);

      expect(hasteMap.files).toEqual(
        createMap({
          'fruits/strawberry.js': ['', 32, 42, 0, '', null],
          'fruits/tomato.js': ['', 33, 42, 0, '', null],
          'vegetables/melon.json': ['', 34, 42, 0, '', null],
        }),
      );

      expect(removedFiles).toEqual(new Map());
    });

    return promise;
  });

  it('updates only changed files', () => {
    process.platform = 'linux';

    nodeCrawl = require('../node');

    // In this test sample, strawberry is changed and tomato is unchanged
    const tomato = ['', 33, 42, 1, '', null];
    const files = createMap({
      'fruits/strawberry.js': ['', 30, 40, 1, '', null],
      'fruits/tomato.js': tomato,
    });

    return nodeCrawl({
      data: {files},
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits'],
    }).then(({hasteMap, removedFiles}) => {
      expect(hasteMap.files).toEqual(
        createMap({
          'fruits/strawberry.js': ['', 32, 42, 0, '', null],
          'fruits/tomato.js': tomato,
        }),
      );

      // Make sure it is the *same* unchanged object.
      expect(hasteMap.files.get('fruits/tomato.js')).toBe(tomato);

      expect(removedFiles).toEqual(new Map());
    });
  });

  it('returns removed files', () => {
    process.platform = 'linux';

    nodeCrawl = require('../node');

    // In this test sample, previouslyExisted was present before and will not be
    // when crawling this directory.
    const files = createMap({
      'fruits/previouslyExisted.js': ['', 30, 40, 1, '', null],
      'fruits/strawberry.js': ['', 33, 42, 0, '', null],
      'fruits/tomato.js': ['', 32, 42, 0, '', null],
    });

    return nodeCrawl({
      data: {files},
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits'],
    }).then(({hasteMap, removedFiles}) => {
      expect(hasteMap.files).toEqual(
        createMap({
          'fruits/strawberry.js': ['', 32, 42, 0, '', null],
          'fruits/tomato.js': ['', 33, 42, 0, '', null],
        }),
      );
      expect(removedFiles).toEqual(
        createMap({
          'fruits/previouslyExisted.js': ['', 30, 40, 1, '', null],
        }),
      );
    });
  });

  it('uses node fs APIs on windows', () => {
    process.platform = 'win32';

    nodeCrawl = require('../node');

    return nodeCrawl({
      data: {
        files: new Map(),
      },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits'],
    }).then(({hasteMap, removedFiles}) => {
      expect(hasteMap.files).toEqual(
        createMap({
          'fruits/directory/strawberry.js': ['', 33, 42, 0, '', null],
          'fruits/tomato.js': ['', 32, 42, 0, '', null],
        }),
      );
      expect(removedFiles).toEqual(new Map());
    });
  });

  it('uses node fs APIs on Unix based OS without find binary', () => {
    process.platform = 'linux';
    const which = require('which');
    which.mockReturnValueOnce(Promise.reject());

    nodeCrawl = require('../node');

    return nodeCrawl({
      data: {
        files: new Map(),
      },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits'],
    }).then(({hasteMap, removedFiles}) => {
      expect(hasteMap.files).toEqual(
        createMap({
          'fruits/directory/strawberry.js': ['', 33, 42, 0, '', null],
          'fruits/tomato.js': ['', 32, 42, 0, '', null],
        }),
      );
      expect(removedFiles).toEqual(new Map());
      expect(which).toBeCalledWith('find');
    });
  });

  it('uses node fs APIs if "forceNodeFilesystemAPI" is set to true, regardless of platform', () => {
    process.platform = 'linux';

    nodeCrawl = require('../node');

    const files = new Map();
    return nodeCrawl({
      data: {files},
      extensions: ['js'],
      forceNodeFilesystemAPI: true,
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits'],
    }).then(({hasteMap, removedFiles}) => {
      expect(hasteMap.files).toEqual(
        createMap({
          'fruits/directory/strawberry.js': ['', 33, 42, 0, '', null],
          'fruits/tomato.js': ['', 32, 42, 0, '', null],
        }),
      );
      expect(removedFiles).toEqual(new Map());
    });
  });

  it('completes with empty roots', () => {
    process.platform = 'win32';

    nodeCrawl = require('../node');

    const files = new Map();
    return nodeCrawl({
      data: {files},
      extensions: ['js'],
      forceNodeFilesystemAPI: true,
      ignore: pearMatcher,
      rootDir,
      roots: [],
    }).then(({hasteMap, removedFiles}) => {
      expect(hasteMap.files).toEqual(new Map());
      expect(removedFiles).toEqual(new Map());
    });
  });

  it('completes with fs.readdir throwing an error', () => {
    process.platform = 'win32';

    nodeCrawl = require('../node');

    const files = new Map();
    return nodeCrawl({
      data: {files},
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: ['/error'],
    }).then(({hasteMap, removedFiles}) => {
      expect(hasteMap.files).toEqual(new Map());
      expect(removedFiles).toEqual(new Map());
    });
  });

  describe('readdir withFileTypes support', () => {
    it('calls lstat for directories and symlinks if readdir withFileTypes is not supported', () => {
      nodeCrawl = require('../node');
      const fs = require('graceful-fs');

      const files = new Map();
      return nodeCrawl({
        data: {files},
        extensions: ['js'],
        forceNodeFilesystemAPI: true,
        ignore: pearMatcher,
        rootDir,
        roots: ['/project/fruits'],
      }).then(({hasteMap, removedFiles}) => {
        expect(hasteMap.files).toEqual(
          createMap({
            'fruits/directory/strawberry.js': ['', 33, 42, 0, '', null],
            'fruits/tomato.js': ['', 32, 42, 0, '', null],
          }),
        );
        expect(removedFiles).toEqual(new Map());
        // once for /project/fruits, once for /project/fruits/directory
        expect(fs.readdir).toHaveBeenCalledTimes(2);
        // once for each of:
        // 1. /project/fruits/directory
        // 2. /project/fruits/directory/strawberry.js
        // 3. /project/fruits/tomato.js
        // 4. /project/fruits/symlink
        // (we never call lstat on the root /project/fruits, since we know it's a directory)
        expect(fs.lstat).toHaveBeenCalledTimes(4);
      });
    });
    it('avoids calling lstat for directories and symlinks if readdir withFileTypes is supported', () => {
      mockHasReaddirWithFileTypesSupport = true;
      nodeCrawl = require('../node');
      const fs = require('graceful-fs');

      const files = new Map();
      return nodeCrawl({
        data: {files},
        extensions: ['js'],
        forceNodeFilesystemAPI: true,
        ignore: pearMatcher,
        rootDir,
        roots: ['/project/fruits'],
      }).then(({hasteMap, removedFiles}) => {
        expect(hasteMap.files).toEqual(
          createMap({
            'fruits/directory/strawberry.js': ['', 33, 42, 0, '', null],
            'fruits/tomato.js': ['', 32, 42, 0, '', null],
          }),
        );
        expect(removedFiles).toEqual(new Map());
        // once for /project/fruits, once for /project/fruits/directory
        expect(fs.readdir).toHaveBeenCalledTimes(2);
        // once for strawberry.js, once for tomato.js
        expect(fs.lstat).toHaveBeenCalledTimes(2);
      });
    });
  });
});
