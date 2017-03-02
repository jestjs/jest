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

const skipOnWindows = require('skipOnWindows');
const slash = require('slash');

jest
  .mock('graceful-fs')
  .mock('jest-file-exists')
  .mock('jest-util', () => {
    const util = require.requireActual('jest-util');
    util.createDirectory = jest.fn();
    return util;
  })
  .mock('vm');

jest.mock(
  'test-preprocessor',
  () => {
    const escapeStrings = str => {
      return str.replace(/'/, `'`);
    };

    return {
      getCacheKey: jest.fn((content, filename, configStr) => 'ab'),
      process: (content, filename, config) => {
        return (`
          const TRANSFORMED = {
            filename: '${escapeStrings(filename)}',
            script: '${escapeStrings(content)}',
            config: '${escapeStrings(JSON.stringify(config))}',
          };
        `);
      },
    };
  },
  {virtual: true},
);

jest.mock(
  'css-preprocessor',
  () => {
    return {
      getCacheKey: jest.fn((content, filename, configStr) => 'cd'),
      process: (content, filename, config) => {
        return (`
          module.exports = {
            filename: ${filename},
            rawFirstLine: ${content.split('\n')[0]},
          };
        `);
      },
    };
  },
  {virtual: true},
);

const getCachePath = (fs, config) => {
  for (const path in mockFs) {
    if (path.startsWith(config.cacheDirectory)) {
      return path;
    }
  }
  return null;
};

let config;
let fs;
let mockFs;
let object;
let transform;
let vm;

describe('transform', () => {

  const reset = () => {
    jest.resetModules();

    object = data => Object.assign(Object.create(null), data);

    vm = require('vm');

    mockFs = object({
      '/fruits/banana.js': [
        'module.exports = "banana";',
      ].join('\n'),
      '/fruits/kiwi.js': [
        'module.exports = () => "kiwi";',
      ].join('\n'),
      '/node_modules/react.js': [
        'module.exports = "react";',
      ].join('\n'),
      '/styles/App.css': [
        'root {',
        '  font-family: Helvetica;',
        '}',
      ].join('\n'),
    });

    fs = require('graceful-fs');
    fs.readFileSync = jest.fn((path, options) => {
      expect(options).toBe('utf8');

      if (mockFs[path]) {
        return mockFs[path];
      }

      throw new Error(`Cannot read path '${path}'.`);
    });
    fs.writeFileSync = jest.fn((path, data, options) => {
      expect(options).toBe('utf8');
      const normalizedPath = slash(path);
      mockFs[normalizedPath] = data;
    });

    fs.unlinkSync = jest.fn();
    fs.statSync = jest.fn(path => ({
      isFile: () => !!mockFs[path],
      mtime: {getTime: () => 42},
    }));

    require('jest-file-exists').mockImplementation(path => !!mockFs[path]);

    config = {
      cache: true,
      cacheDirectory: '/cache/',
      name: 'test',
      rootDir: '/',
      transformIgnorePatterns: ['/node_modules/'],
    };

    transform = require('../transform');
  };

  beforeEach(reset);

  it('transforms a file properly', () => {
    config.collectCoverage = true;
    const response = transform('/fruits/banana.js', config);

    expect(response instanceof vm.Script).toBe(true);
    expect(vm.Script.mock.calls[0][0]).toMatchSnapshot();

    // no-cache case
    expect(fs.readFileSync.mock.calls.length).toBe(1);
    expect(fs.readFileSync).toBeCalledWith('/fruits/banana.js', 'utf8');

    // in-memory cache
    const response2 = transform('/fruits/banana.js', config);
    expect(response2).toBe(response);

    transform('/fruits/kiwi.js', config);
    const snapshot = vm.Script.mock.calls[1][0];
    expect(snapshot).toMatchSnapshot();

    transform(
      '/fruits/kiwi.js',
      Object.assign({}, config, {collectCoverage: true}),
    );

    expect(vm.Script.mock.calls[0][0]).not.toEqual(snapshot);
    expect(vm.Script.mock.calls[0][0]).not.toMatch(/instrumented kiwi/);

    // If we disable coverage, we get a different result.
    transform(
      '/fruits/kiwi.js',
      Object.assign({}, config, {collectCoverage: false}),
    );
    expect(vm.Script.mock.calls[1][0]).toEqual(snapshot);
  });

  it('uses the supplied preprocessor', () => {
    config = Object.assign(config, {
      transform: [['^.+\\.js$', 'test-preprocessor']],
    });

    transform('/fruits/banana.js', config);

    expect(require('test-preprocessor').getCacheKey).toBeCalled();

    expect(vm.Script.mock.calls[0][0]).toMatchSnapshot();

    transform('/node_modules/react.js', config);
    // ignores preprocessor
    expect(vm.Script.mock.calls[1][0]).toMatchSnapshot();
  });

  it('uses multiple preprocessors', () => {
    config = Object.assign(config, {
      transform: [
        ['^.+\\.js$', 'test-preprocessor'],
        ['^.+\\.css$', 'css-preprocessor'],
      ],
    });

    transform('/fruits/banana.js', config);
    transform('/styles/App.css', config);

    expect(require('test-preprocessor').getCacheKey).toBeCalled();
    expect(require('css-preprocessor').getCacheKey).toBeCalled();
    expect(vm.Script.mock.calls[0][0]).toMatchSnapshot();
    expect(vm.Script.mock.calls[1][0]).toMatchSnapshot();

    transform('/node_modules/react.js', config);
    // ignores preprocessor
    expect(vm.Script.mock.calls[2][0]).toMatchSnapshot();
  });

  it('reads values from the cache', () => {
    // if (skipOnWindows.test()) {
    //   return;
    // }
    const transformConfig = Object.assign(config, {
      transform: [['^.+\\.js$', 'test-preprocessor']],
    });
    transform('/fruits/banana.js', transformConfig);

    const cachePath = getCachePath(mockFs, config);
    expect(fs.writeFileSync).toBeCalled();
    expect(fs.writeFileSync.mock.calls[0][0]).toBe(cachePath);

    // Cache the state in `mockFsCopy`
    const mockFsCopy = mockFs;
    jest.resetModuleRegistry();
    reset();

    // Restore the cached fs
    mockFs = mockFsCopy;
    transform('/fruits/banana.js', transformConfig);

    expect(fs.readFileSync.mock.calls.length).toBe(2);
    expect(fs.readFileSync).toBeCalledWith('/fruits/banana.js', 'utf8');
    expect(fs.readFileSync).toBeCalledWith(cachePath, 'utf8');
    expect(fs.writeFileSync).not.toBeCalled();

    // Don't read from the cache when `config.cache` is false.
    jest.resetModuleRegistry();
    reset();
    mockFs = mockFsCopy;
    transformConfig.cache = false;
    transform('/fruits/banana.js', transformConfig);

    expect(fs.readFileSync.mock.calls.length).toBe(1);
    expect(fs.readFileSync).toBeCalledWith('/fruits/banana.js', 'utf8');
    expect(fs.readFileSync).not.toBeCalledWith(cachePath, 'utf8');
    expect(fs.writeFileSync).toBeCalled();
  });
});
