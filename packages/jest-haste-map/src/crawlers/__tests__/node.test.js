/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

jest.mock('child_process', () => ({
  spawn: jest.fn((cmd, args) => {
    let closeCallback;
    return {
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'exit') {
          callback(mockSpawnExit, null);
        }
      }),
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

jest.mock('graceful-fs', () => {
  const slash = require('slash');
  let mtime = 32;
  const size = 42;
  const stat = (path, callback) => {
    setTimeout(
      () =>
        callback(null, {
          isDirectory() {
            return slash(path).endsWith('/directory');
          },
          isSymbolicLink() {
            return slash(path).endsWith('symlink');
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
      if (callback === undefined) {
        if (typeof options === 'function') {
          callback = options;
        }
        throw new Error('readdir: callback is not a function!');
      }

      if (slash(dir) === '/project/fruits') {
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
      } else if (slash(dir) === '/project/fruits/directory') {
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
      } else if (slash(dir) == '/error') {
        setTimeout(() => callback({code: 'ENOTDIR'}, undefined), 0);
      }
    }),
    stat: jest.fn(stat),
  };
});

const pearMatcher = path => /pear/.test(path);
const normalize = path =>
  process.platform === 'win32' ? path.replaceAll('/', '\\') : path;
const createMap = obj =>
  new Map(Object.keys(obj).map(key => [normalize(key), obj[key]]));

const rootDir = '/project';
let mockResponse;
let mockSpawnExit;
let nodeCrawl;
let childProcess;

describe('node crawler', () => {
  beforeEach(() => {
    jest.resetModules();

    mockResponse = [
      '/project/fruits/pear.js',
      '/project/fruits/strawberry.js',
      '/project/fruits/tomato.js',
    ].join('\n');

    mockSpawnExit = 0;
  });

  it('crawls for files based on patterns', async () => {
    childProcess = require('child_process');
    nodeCrawl = require('../node').nodeCrawl;

    mockResponse = [
      '/project/fruits/pear.js',
      '/project/fruits/strawberry.js',
      '/project/fruits/tomato.js',
      '/project/vegetables/melon.json',
    ].join('\n');

    const {hasteMap, removedFiles} = await nodeCrawl({
      data: {
        files: new Map(),
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits', '/project/vegetables'],
    });

    expect(childProcess.spawn).toHaveBeenLastCalledWith('find', [
      '/project/fruits',
      '/project/vegetables',
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

    expect(hasteMap.files).not.toBeNull();

    expect(hasteMap.files).toEqual(
      createMap({
        'fruits/strawberry.js': ['', 32, 42, 0, '', null],
        'fruits/tomato.js': ['', 33, 42, 0, '', null],
        'vegetables/melon.json': ['', 34, 42, 0, '', null],
      }),
    );

    expect(removedFiles).toEqual(new Map());
  });

  it('updates only changed files', async () => {
    nodeCrawl = require('../node').nodeCrawl;

    // In this test sample, strawberry is changed and tomato is unchanged
    const tomato = ['', 33, 42, 1, '', null];
    const files = createMap({
      'fruits/strawberry.js': ['', 30, 40, 1, '', null],
      'fruits/tomato.js': tomato,
    });

    const {hasteMap, removedFiles} = await nodeCrawl({
      data: {files},
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits'],
    });

    expect(hasteMap.files).toEqual(
      createMap({
        'fruits/strawberry.js': ['', 32, 42, 0, '', null],
        'fruits/tomato.js': tomato,
      }),
    );

    // Make sure it is the *same* unchanged object.
    expect(hasteMap.files.get(normalize('fruits/tomato.js'))).toBe(tomato);

    expect(removedFiles).toEqual(new Map());
  });

  it('returns removed files', async () => {
    nodeCrawl = require('../node').nodeCrawl;

    // In this test sample, previouslyExisted was present before and will not be
    // when crawling this directory.
    const files = createMap({
      'fruits/previouslyExisted.js': ['', 30, 40, 1, '', null],
      'fruits/strawberry.js': ['', 33, 42, 0, '', null],
      'fruits/tomato.js': ['', 32, 42, 0, '', null],
    });

    const {hasteMap, removedFiles} = await nodeCrawl({
      data: {files},
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits'],
    });

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

  it('uses node fs APIs with incompatible find binary', async () => {
    mockResponse = '';
    mockSpawnExit = 1;
    childProcess = require('child_process');

    nodeCrawl = require('../node').nodeCrawl;

    const {hasteMap, removedFiles} = await nodeCrawl({
      data: {
        files: new Map(),
      },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits'],
    });

    expect(childProcess.spawn).toHaveBeenLastCalledWith(
      'find',
      ['.', '-type', 'f', '(', '-iname', '*.ts', '-o', '-iname', '*.js', ')'],
      {cwd: expect.any(String)},
    );
    expect(hasteMap.files).toEqual(
      createMap({
        'fruits/directory/strawberry.js': ['', 33, 42, 0, '', null],
        'fruits/tomato.js': ['', 32, 42, 0, '', null],
      }),
    );
    expect(removedFiles).toEqual(new Map());
  });

  it('uses node fs APIs without find binary', async () => {
    childProcess = require('child_process');
    childProcess.spawn.mockImplementationOnce(() => {
      throw new Error();
    });
    nodeCrawl = require('../node').nodeCrawl;

    const {hasteMap, removedFiles} = await nodeCrawl({
      data: {
        files: new Map(),
      },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits'],
    });

    expect(hasteMap.files).toEqual(
      createMap({
        'fruits/directory/strawberry.js': ['', 33, 42, 0, '', null],
        'fruits/tomato.js': ['', 32, 42, 0, '', null],
      }),
    );
    expect(removedFiles).toEqual(new Map());
  });

  it('uses node fs APIs if "forceNodeFilesystemAPI" is set to true, regardless of platform', async () => {
    childProcess = require('child_process');
    nodeCrawl = require('../node').nodeCrawl;

    const files = new Map();
    const {hasteMap, removedFiles} = await nodeCrawl({
      data: {files},
      extensions: ['js'],
      forceNodeFilesystemAPI: true,
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits'],
    });

    expect(childProcess.spawn).toHaveBeenCalledTimes(0);
    expect(hasteMap.files).toEqual(
      createMap({
        'fruits/directory/strawberry.js': ['', 33, 42, 0, '', null],
        'fruits/tomato.js': ['', 32, 42, 0, '', null],
      }),
    );
    expect(removedFiles).toEqual(new Map());
  });

  it('completes with empty roots', async () => {
    nodeCrawl = require('../node').nodeCrawl;

    const files = new Map();
    const {hasteMap, removedFiles} = await nodeCrawl({
      data: {files},
      extensions: ['js'],
      forceNodeFilesystemAPI: true,
      ignore: pearMatcher,
      rootDir,
      roots: [],
    });

    expect(hasteMap.files).toEqual(new Map());
    expect(removedFiles).toEqual(new Map());
  });

  it('completes with fs.readdir throwing an error', async () => {
    nodeCrawl = require('../node').nodeCrawl;

    const files = new Map();
    const {hasteMap, removedFiles} = await nodeCrawl({
      data: {files},
      extensions: ['js'],
      forceNodeFilesystemAPI: true,
      ignore: pearMatcher,
      rootDir,
      roots: ['/error'],
    });

    expect(hasteMap.files).toEqual(new Map());
    expect(removedFiles).toEqual(new Map());
  });

  it('avoids calling lstat for directories and symlinks', async () => {
    nodeCrawl = require('../node').nodeCrawl;
    const fs = require('graceful-fs');

    const files = new Map();
    const {hasteMap, removedFiles} = await nodeCrawl({
      data: {files},
      extensions: ['js'],
      forceNodeFilesystemAPI: true,
      ignore: pearMatcher,
      rootDir,
      roots: ['/project/fruits'],
    });

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
