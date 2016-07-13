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

jest
  .mock('graceful-fs')
  .mock('jest-resolve')
  .mock('jest-util')
  .mock('vm');

jest.mock(
  'test-preprocessor',
  () => {
    const stableStringify = require('json-stable-stringify');
    return {
      getCacheKey: jest.fn((content, filename, configStr) => 'ab'),
      process: (content, filename, config) => {
        return (
          `\nScript: ${content}\n` +
          `Path: ${filename}\n` +
          `Config: ${stableStringify(config, {space: 2})}`
        );
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
    object = data => Object.assign(Object.create(null), data);

    vm = require('vm');

    mockFs = object({
      '/fruits/banana.js': [
        'module.exports = "banana";',
      ].join('\n'),
      '/fruits/kiwi.js': [
        'module.exports = () => "kiwi"',
      ].join('\n'),
      '/node_modules/react.js': [
        'module.exports = "react"',
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
      mockFs[path] = data;
    });

    fs.unlinkSync = jest.fn();
    fs.statSync = jest.fn(path => ({
      isFile: () => !!mockFs[path],
      mtime: {getTime: () => 42},
    }));

    require('jest-resolve').fileExists = jest.fn(path => !!mockFs[path]);

    config = {
      cache: true,
      cacheDirectory: '/cache/',
      name: 'test',
      preprocessorIgnorePatterns: ['/node_modules/'],
    };

    transform = require('../transform');
  };

  beforeEach(reset);

  it('transforms a file properly', () => {
    const response = transform('/fruits/banana.js', config);

    expect(response instanceof vm.Script);
    expect(vm.Script.mock.calls[0][0]).toMatchSnapshot();

    // no-cache case
    expect(fs.readFileSync.mock.calls.length).toBe(1);
    expect(fs.readFileSync).toBeCalledWith('/fruits/banana.js', 'utf8');

    // in-memory cache
    const response2 = transform('/fruits/banana.js', config);
    expect(response2).toBe(response);

    transform('/fruits/kiwi.js', config, {
      instrument: () => 'instrumented kiwi',
    });
    expect(vm.Script.mock.calls[1][0]).toMatchSnapshot();
  });

  it('uses the supplied preprocessor', () => {
    config = Object.assign(config, {
      scriptPreprocessor: 'test-preprocessor',
    });

    transform('/fruits/banana.js', config);

    expect(require('test-preprocessor').getCacheKey).toBeCalled();

    expect(vm.Script.mock.calls[0][0]).toMatchSnapshot();

    transform('/node_modules/react.js', config);
    expect(vm.Script.mock.calls[1][0]).toMatchSnapshot();
  });

  it('reads values from the cache', () => {
    const transformConfig = Object.assign(config, {
      scriptPreprocessor: 'test-preprocessor',
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
