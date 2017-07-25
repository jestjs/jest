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

const crypto = require('crypto');
const slash = require('slash');

jest
  .mock('fs')
  .mock('graceful-fs')
  .mock('jest-haste-map', () => ({
    getCacheFilePath: (cacheDir, baseDir, version) => cacheDir + baseDir,
  }))
  .mock('jest-util', () => {
    const util = require.requireActual('jest-util');
    util.createDirectory = jest.fn();
    return util;
  })
  .mock('vm');

jest.mock(
  'test_preprocessor',
  () => {
    const escapeStrings = str => {
      return str.replace(/'/, `'`);
    };

    return {
      getCacheKey: jest.fn((content, filename, configStr) => 'ab'),
      process: (content, filename, config) => {
        return `
          const TRANSFORMED = {
            filename: '${escapeStrings(filename)}',
            script: '${escapeStrings(content)}',
            config: '${escapeStrings(JSON.stringify(config))}',
          };
        `;
      },
    };
  },
  {virtual: true},
);

jest.mock(
  'preprocessor-with-sourcemaps',
  () => {
    return {
      getCacheKey: jest.fn((content, filename, configStr) => 'ab'),
      process: jest.fn(),
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
        return `
          module.exports = {
            filename: ${filename},
            rawFirstLine: ${content.split('\n')[0]},
          };
        `;
      },
    };
  },
  {virtual: true},
);

jest.mock(
  'passthrough-preprocessor',
  () => {
    return {
      process: jest.fn(),
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

let ScriptTransformer;
let config;
let fs;
let mockFs;
let object;
let vm;
let writeFileAtomic;

jest.mock('write-file-atomic', () => ({
  sync: jest.fn().mockImplementation((filePath, data) => {
    const normalizedPath = require('slash')(filePath);
    mockFs[normalizedPath] = data;
  }),
}));

describe('ScriptTransformer', () => {
  const reset = () => {
    jest.resetModules();

    object = data => Object.assign(Object.create(null), data);

    vm = require('vm');

    mockFs = object({
      '/fruits/banana.js': ['module.exports = "banana";'].join('\n'),
      '/fruits/grapefruit.js': [
        'module.exports = function () { return "grapefruit"; }',
      ].join('\n'),
      '/fruits/kiwi.js': ['module.exports = () => "kiwi";'].join('\n'),
      '/node_modules/react.js': ['module.exports = "react";'].join('\n'),
      '/styles/App.css': ['root {', '  font-family: Helvetica;', '}'].join(
        '\n',
      ),
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

    fs.existsSync = jest.fn(path => !!mockFs[path]);

    writeFileAtomic = require('write-file-atomic');

    config = {
      cache: true,
      cacheDirectory: '/cache/',
      name: 'test',
      rootDir: '/',
      transformIgnorePatterns: ['/node_modules/'],
    };

    ScriptTransformer = require('../script_transformer');
  };

  beforeEach(reset);

  it('transforms a file properly', () => {
    const scriptTransformer = new ScriptTransformer(config);
    const response = scriptTransformer.transform('/fruits/banana.js', {
      collectCoverage: true,
    }).script;

    expect(response instanceof vm.Script).toBe(true);
    expect(vm.Script.mock.calls[0][0]).toMatchSnapshot();

    // no-cache case
    expect(fs.readFileSync.mock.calls.length).toBe(1);
    expect(fs.readFileSync).toBeCalledWith('/fruits/banana.js', 'utf8');

    // in-memory cache
    const response2 = scriptTransformer.transform('/fruits/banana.js', {
      collectCoverage: true,
    }).script;
    expect(response2).toBe(response);

    scriptTransformer.transform('/fruits/kiwi.js', {
      collectCoverage: true,
    });
    const snapshot = vm.Script.mock.calls[1][0];
    expect(snapshot).toMatchSnapshot();

    scriptTransformer.transform('/fruits/kiwi.js', {collectCoverage: true});

    expect(vm.Script.mock.calls[0][0]).not.toEqual(snapshot);
    expect(vm.Script.mock.calls[0][0]).not.toMatch(/instrumented kiwi/);

    // If we disable coverage, we get a different result.
    scriptTransformer.transform('/fruits/kiwi.js', {collectCoverage: false});
    expect(vm.Script.mock.calls[1][0]).toEqual(snapshot);
  });

  it(
    "throws an error if `process` doesn't return a string or an object" +
      'containing `code` key with processed string',
    () => {
      config = Object.assign(config, {
        transform: [['^.+\\.js$', 'passthrough-preprocessor']],
      });
      const scriptTransformer = new ScriptTransformer(config);

      const incorrectReturnValues = [
        [undefined, '/fruits/banana.js'],
        [{a: 'a'}, '/fruits/kiwi.js'],
        [[], '/fruits/grapefruit.js'],
      ];

      incorrectReturnValues.forEach(([returnValue, filePath]) => {
        require('passthrough-preprocessor').process.mockReturnValue(
          returnValue,
        );
        expect(() => scriptTransformer.transform(filePath, {})).toThrow(
          'must return a string',
        );
      });

      const correctReturnValues = [
        ['code', '/fruits/banana.js'],
        [{code: 'code'}, '/fruits/kiwi.js'],
      ];

      correctReturnValues.forEach(([returnValue, filePath]) => {
        require('passthrough-preprocessor').process.mockReturnValue(
          returnValue,
        );
        expect(() => scriptTransformer.transform(filePath, {})).not.toThrow();
      });
    },
  );

  it('uses the supplied preprocessor', () => {
    config = Object.assign(config, {
      transform: [['^.+\\.js$', 'test_preprocessor']],
    });
    const scriptTransformer = new ScriptTransformer(config);
    scriptTransformer.transform('/fruits/banana.js', {});

    expect(require('test_preprocessor').getCacheKey).toBeCalled();

    expect(vm.Script.mock.calls[0][0]).toMatchSnapshot();

    scriptTransformer.transform('/node_modules/react.js', {});
    // ignores preprocessor
    expect(vm.Script.mock.calls[1][0]).toMatchSnapshot();
  });

  it('uses multiple preprocessors', () => {
    config = Object.assign(config, {
      transform: [
        ['^.+\\.js$', 'test_preprocessor'],
        ['^.+\\.css$', 'css-preprocessor'],
      ],
    });
    const scriptTransformer = new ScriptTransformer(config);

    scriptTransformer.transform('/fruits/banana.js', {});
    scriptTransformer.transform('/styles/App.css', {});

    expect(require('test_preprocessor').getCacheKey).toBeCalled();
    expect(require('css-preprocessor').getCacheKey).toBeCalled();
    expect(vm.Script.mock.calls[0][0]).toMatchSnapshot();
    expect(vm.Script.mock.calls[1][0]).toMatchSnapshot();

    scriptTransformer.transform('/node_modules/react.js', {});
    // ignores preprocessor
    expect(vm.Script.mock.calls[2][0]).toMatchSnapshot();
  });

  it('writes source map if preprocessor supplies it', () => {
    config = Object.assign(config, {
      transform: [['^.+\\.js$', 'preprocessor-with-sourcemaps']],
    });
    const scriptTransformer = new ScriptTransformer(config);

    const map = {
      mappings: ';AAAA',
      version: 3,
    };

    require('preprocessor-with-sourcemaps').process.mockReturnValue({
      code: 'content',
      map,
    });

    const result = scriptTransformer.transform('/fruits/banana.js', {
      collectCoverage: true,
      mapCoverage: true,
    });
    expect(result.sourceMapPath).toEqual(expect.any(String));
    const mapStr = JSON.stringify(map);
    expect(writeFileAtomic.sync).toBeCalledWith(result.sourceMapPath, mapStr, {
      encoding: 'utf8',
    });
  });

  it('writes source map if preprocessor inlines it', () => {
    config = Object.assign(config, {
      transform: [['^.+\\.js$', 'preprocessor-with-sourcemaps']],
    });
    const scriptTransformer = new ScriptTransformer(config);

    const sourceMap = JSON.stringify({
      mappings: 'AAAA,IAAM,CAAC,GAAW,CAAC,CAAC',
      version: 3,
    });

    const content =
      'var x = 1;\n' +
      '//# sourceMappingURL=data:application/json;base64,' +
      new Buffer(sourceMap).toString('base64');

    require('preprocessor-with-sourcemaps').process.mockReturnValue(content);

    const result = scriptTransformer.transform('/fruits/banana.js', {
      collectCoverage: true,
      mapCoverage: true,
    });
    expect(result.sourceMapPath).toEqual(expect.any(String));
    expect(
      writeFileAtomic.sync,
    ).toBeCalledWith(result.sourceMapPath, sourceMap, {encoding: 'utf8'});
  });

  it('does not write source map if mapCoverage option is false', () => {
    config = Object.assign(config, {
      transform: [['^.+\\.js$', 'preprocessor-with-sourcemaps']],
    });
    const scriptTransformer = new ScriptTransformer(config);

    const map = {
      mappings: ';AAAA',
      version: 3,
    };

    require('preprocessor-with-sourcemaps').process.mockReturnValue({
      code: 'content',
      map,
    });

    const result = scriptTransformer.transform('/fruits/banana.js', {
      collectCoverage: true,
      mapCoverage: false,
    });
    expect(result.sourceMapPath).toBeFalsy();
    expect(writeFileAtomic.sync).toHaveBeenCalledTimes(1);
  });

  it('reads values from the cache', () => {
    const transformConfig = Object.assign(config, {
      transform: [['^.+\\.js$', 'test_preprocessor']],
    });
    let scriptTransformer = new ScriptTransformer(transformConfig);
    scriptTransformer.transform('/fruits/banana.js', {});

    const cachePath = getCachePath(mockFs, config);
    expect(writeFileAtomic.sync).toBeCalled();
    expect(writeFileAtomic.sync.mock.calls[0][0]).toBe(cachePath);

    // Cache the state in `mockFsCopy`
    const mockFsCopy = mockFs;
    jest.resetModuleRegistry();
    reset();

    // Restore the cached fs
    mockFs = mockFsCopy;
    scriptTransformer = new ScriptTransformer(transformConfig);
    scriptTransformer.transform('/fruits/banana.js', {});

    expect(fs.readFileSync.mock.calls.length).toBe(2);
    expect(fs.readFileSync).toBeCalledWith('/fruits/banana.js', 'utf8');
    expect(fs.readFileSync).toBeCalledWith(cachePath, 'utf8');
    expect(writeFileAtomic.sync).not.toBeCalled();

    // Don't read from the cache when `config.cache` is false.
    jest.resetModuleRegistry();
    reset();
    mockFs = mockFsCopy;
    transformConfig.cache = false;
    scriptTransformer = new ScriptTransformer(transformConfig);
    scriptTransformer.transform('/fruits/banana.js', {});

    expect(fs.readFileSync.mock.calls.length).toBe(1);
    expect(fs.readFileSync).toBeCalledWith('/fruits/banana.js', 'utf8');
    expect(fs.readFileSync).not.toBeCalledWith(cachePath, 'utf8');
    expect(writeFileAtomic.sync).toBeCalled();
  });
});
