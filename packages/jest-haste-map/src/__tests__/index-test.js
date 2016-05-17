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

jest.unmock('../constants')
  .unmock('../lib/docblock')
  .unmock('../lib/extractRequires')
  .unmock('../lib/getPlatformExtension')
  .unmock('../worker')
  .unmock('../fastpath')
  .unmock('../');

jest.mock('child_process', () => ({
  // If this does not throw, we'll use the (mocked) watchman crawler
  execSync() {},
}));

jest.mock('worker-farm', () => {
  const mock = jest.fn(
    (options, worker) => workerFarmMock = jest.fn(
      (data, callback) => require(worker)(data, callback)
    )
  );
  mock.end = jest.fn();
  return mock;
});

jest.mock('../crawlers/watchman', () =>
  jest.fn((roots, extensions, ignore, data) => {
    data.clocks = mockClocks;

    const list = changedFiles || mockFs;
    for (const file in list) {
      if (new RegExp(roots.join('|')).test(file) && !ignore(file)) {
        if (list[file]) {
          data.files[file] = ['', 32, 0, []];
        } else {
          delete data.files[file];
        }
      }
    }

    return Promise.resolve(data);
  })
);

const cacheFilePath = '/cache-file';
let H;
let HasteMap;
let changedFiles;
let consoleWarn;
let defaultConfig;
let fs;
let mockClocks;
let mockFs;
let object;
let readFileSync;
let writeFileSync;
let workerFarmMock;

describe('HasteMap', () => {

  beforeEach(() => {
    object = data => Object.assign(Object.create(null), data);

    mockFs = object({
      '/fruits/pear.js': [
        '/**',
        ' * @providesModule Pear',
        ' */',
        'const Banana = require("Banana");',
        'const Strawberry = require("Strawberry");',
      ].join('\n'),
      '/fruits/banana.js': [
        '/**',
        ' * @providesModule Banana',
        ' */',
        'const Strawberry = require("Strawberry");',
      ].join('\n'),
      '/fruits/strawberry.js': [
        '/**',
        ' * @providesModule Strawberry',
        ' */',
      ].join('\n'),
      '/fruits/kiwi.js': [
        '/**',
        ' * @providesModule Kiwi',
        ' */',
      ].join('\n'),
      '/vegetables/melon.js': [
        '/**',
        ' * @providesModule Melon',
        ' */',
      ].join('\n'),
      '/fruits/__mocks__/Pear.js': [
        'const Melon = require("Melon");',
      ].join('\n'),
    });
    mockClocks = object({
      '/fruits': 'c:fake-clock:1',
      '/vegetables': 'c:fake-clock:2',
    });

    changedFiles = null;

    fs = require('graceful-fs');
    readFileSync = fs.readFileSync;
    writeFileSync = fs.writeFileSync;
    fs.readFileSync = jest.fn((path, options) => {
      expect(options).toBe('utf-8');

      // A file change can be triggered by writing into the
      // changedFiles object.
      if (changedFiles && (path in changedFiles)) {
        return changedFiles[path];
      }

      if (mockFs[path]) {
        return mockFs[path];
      }

      throw new Error(`Cannot read path '${path}'.`);
    });
    fs.writeFileSync = jest.fn((path, data, options) => {
      expect(options).toBe('utf-8');
      mockFs[path] = data;
    });

    consoleWarn = console.warn;
    console.warn = jest.fn();

    HasteMap = require('../');
    H = HasteMap.H;

    HasteMap.getCacheFilePath = jest.fn(() => cacheFilePath);

    defaultConfig = {
      extensions: ['js', 'json'],
      ignorePattern: /kiwi/,
      maxWorkers: 1,
      name: 'haste-map-test',
      platforms: ['ios', 'android'],
      resetCache: false,
      roots: ['/fruits', '/vegetables'],
      useWatchman: true,
    };
  });

  afterEach(() => {
    console.warn = consoleWarn;
    fs.readFileSync = readFileSync;
    fs.writeFileSync = writeFileSync;
  });

  it('exports fastpath and constants', () => {
    expect(HasteMap.fastpath).toBe(require('../fastpath'));
    expect(HasteMap.H).toBe(require('../constants'));
  });

  it('creates valid cache file paths', () => {
    jest.resetModuleRegistry();
    HasteMap = require('../');

    expect(HasteMap.getCacheFilePath('/', '@scoped/package', 'random-value'))
      .toMatch(/^\/-scoped-package-(.*)$/);

    expect(
      HasteMap.getCacheFilePath('/', '@scoped/package', 'random-value')
    ).not.toEqual(
      HasteMap.getCacheFilePath('/', '-scoped-package', 'random-value')
    );
  });

  it('matches files against a pattern', () => {
    const hasteMap = new HasteMap(defaultConfig);

    return hasteMap.matchFiles(/fruits/).then(files => {
      expect(files).toEqual([
        '/fruits/pear.js',
        '/fruits/banana.js',
        '/fruits/strawberry.js',
        '/fruits/__mocks__/Pear.js',
      ]);

      return hasteMap.matchFiles(/__mocks__/).then(files => {
        expect(files).toEqual([
          '/fruits/__mocks__/Pear.js',
        ]);
      });
    });
  });

  it('builds a haste map on a fresh cache', () => {
    // Include these files in the map
    mockFs['/fruits/node_modules/react/react.js'] = [
      '/**',
      ' * @providesModule React',
      ' */',
      'const Component = require("Component");',
    ].join('\n');
    mockFs['/fruits/node_modules/fbjs/lib/flatMap.js'] = [
      '/**',
      ' * @providesModule flatMap',
      ' */',
    ].join('\n');

    // Ignore these
    mockFs['/fruits/node_modules/react/node_modules/fbjs/lib/mapObject.js'] = [
      '/**',
      ' * @providesModule mapObject',
      ' */',
    ].join('\n');
    mockFs['/fruits/node_modules/jest/jest.js'] = [
      '/**',
      ' * @providesModule Jest',
      ' */',
      'const Test = require("Test");',
    ].join('\n');

    const hasteMap = new HasteMap(Object.assign({}, defaultConfig, {
      mocksPattern: '/__mocks__/',
      providesModuleNodeModules: ['react', 'fbjs'],
    }));

    return hasteMap.build().then(data => {
      expect(data.clocks).toEqual(mockClocks);

      expect(data.files).toEqual({
        '/fruits/__mocks__/Pear.js': ['', 32, 1, ['Melon']],
        '/fruits/banana.js': ['Banana', 32, 1, ['Strawberry']],
        '/fruits/pear.js': ['Pear', 32, 1, ['Banana', 'Strawberry']],
        '/fruits/strawberry.js': ['Strawberry', 32, 1, []],
        '/vegetables/melon.js': ['Melon', 32, 1, []],

        // node modules
        '/fruits/node_modules/fbjs/lib/flatMap.js': ['flatMap', 32, 1, []],
        '/fruits/node_modules/react/react.js': ['React', 32, 1, ['Component']],
      });

      expect(data.map).toEqual({
        'Pear': {[H.GENERIC_PLATFORM]: ['/fruits/pear.js', H.MODULE]},
        'Banana': {[H.GENERIC_PLATFORM]: ['/fruits/banana.js', H.MODULE]},
        'React': {
          [H.GENERIC_PLATFORM]: [
            '/fruits/node_modules/react/react.js',
            H.MODULE,
          ],
        },
        'flatMap': {
          [H.GENERIC_PLATFORM]: [
            '/fruits/node_modules/fbjs/lib/flatMap.js',
            H.MODULE,
          ],
        },
        'Strawberry': {
          [H.GENERIC_PLATFORM]: ['/fruits/strawberry.js', H.MODULE],
        },
        'Melon': {[H.GENERIC_PLATFORM]: ['/vegetables/melon.js', H.MODULE]},
      });

      expect(data.mocks).toEqual({
        'Pear': '/fruits/__mocks__/Pear.js',
      });

      // The cache file must exactly mirror the data structure returned
      // from a build.
      expect(hasteMap.read()).toEqual(data);
    });
  });

  it('warns on duplicate module ids', () => {
    // Raspberry thinks it is a Strawberry
    mockFs['/fruits/raspberry.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Banana = require("Banana");',
    ].join('\n');

    return new HasteMap(defaultConfig).build().then(data => {
      expect(data.map.Strawberry[H.GENERIC_PLATFORM][0])
        .toEqual('/fruits/strawberry.js');

      expect(console.warn).toBeCalledWith([
        'jest-haste-map: @providesModule naming collision:',
        '  Duplicate module name: Strawberry',
        '  Paths: /fruits/raspberry.js collides with /fruits/strawberry.js',
        '',
        'This warning is caused by a @providesModule declaration with the ' +
        'same name accross two different files.',
      ].join('\n'));
    });
  });

  it('splits up modules by platform', () => {
    mockFs = Object.create(null);
    mockFs['/fruits/strawberry.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Banana = require("Banana");',
    ].join('\n');

    mockFs['/fruits/strawberry.ios.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Raspberry = require("Raspberry");',
    ].join('\n');

    mockFs['/fruits/strawberry.android.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Blackberry = require("Blackberry");',
    ].join('\n');

    return new HasteMap(defaultConfig).build().then(data => {
      expect(data.files).toEqual({
        '/fruits/strawberry.js': ['Strawberry', 32, 1, ['Banana']],
        '/fruits/strawberry.ios.js': ['Strawberry', 32, 1, ['Raspberry']],
        '/fruits/strawberry.android.js': ['Strawberry', 32, 1, ['Blackberry']],
      });

      expect(data.map).toEqual({
        'Strawberry': {
          [H.GENERIC_PLATFORM]: ['/fruits/strawberry.js', H.MODULE],
          'ios': ['/fruits/strawberry.ios.js', H.MODULE],
          'android': ['/fruits/strawberry.android.js', H.MODULE],
        },
      });
    });
  });

  it('does not access the file system on a warm cache with no changes', () => {
    return new HasteMap(defaultConfig).build().then(initialData => {
      // The first run should access the file system once for the (empty) cache
      // file and five times for the files in the system.
      expect(fs.readFileSync.mock.calls.length).toBe(6);

      fs.readFileSync.mockClear();

      // Explicitly mock that no files have changed.
      changedFiles = Object.create(null);

      // Watchman would give us different clocks.
      mockClocks = object({
        '/fruits': 'c:fake-clock:3',
        '/vegetables': 'c:fake-clock:4',
      });

      return new HasteMap(defaultConfig).build().then(data => {
        expect(fs.readFileSync.mock.calls.length).toBe(1);
        expect(fs.readFileSync).toBeCalledWith(cacheFilePath, 'utf-8');

        expect(data.clocks).toEqual(mockClocks);
        expect(data.files).toEqual(initialData.files);
        expect(data.map).toEqual(initialData.map);
      });
    });
  });

  it('only does minimal file system access when files change', () => {
    return new HasteMap(defaultConfig).build().then(initialData => {
      fs.readFileSync.mockClear();

      // Let's assume one JS file has changed.
      changedFiles = object({
        '/fruits/banana.js': [
          '/**',
          ' * @providesModule Kiwi', // Identity crisis.
          ' */',
          'const Raspberry = require("Raspberry");',
        ].join('\n'),
      });

      // Watchman would give us different clocks for `/fruits`.
      mockClocks = object({
        '/fruits': 'c:fake-clock:3',
        '/vegetables': 'c:fake-clock:2',
      });

      return new HasteMap(defaultConfig).build().then(data => {
        expect(fs.readFileSync.mock.calls.length).toBe(2);

        expect(fs.readFileSync).toBeCalledWith(cacheFilePath, 'utf-8');
        expect(fs.readFileSync).toBeCalledWith('/fruits/banana.js', 'utf-8');

        expect(data.clocks).toEqual(mockClocks);

        const files = object(initialData.files);
        files['/fruits/banana.js'] = ['Kiwi', 32, 1, ['Raspberry']];

        expect(data.files).toEqual(files);

        const map = object(initialData.map);

        map.Kiwi = map.Banana;
        delete map.Banana;
        expect(data.map).toEqual(map);
      });
    });
  });

  it('correctly handles file deletions', () => {
    return new HasteMap(defaultConfig).build().then(initialData => {
      fs.readFileSync.mockClear();

      // Let's assume one JS file was removed.
      delete mockFs['/fruits/banana.js'];
      changedFiles = object({
        '/fruits/banana.js': null,
      });

      // Watchman would give us different clocks for `/fruits`.
      mockClocks = object({
        '/fruits': 'c:fake-clock:3',
        '/vegetables': 'c:fake-clock:2',
      });

      return new HasteMap(defaultConfig).build().then(data => {
        const files = object(initialData.files);
        delete files['/fruits/banana.js'];
        expect(data.files).toEqual(files);

        const map = object(initialData.map);
        delete map.Banana;
        expect(data.map).toEqual(map);
      });
    });
  });

  it('ignores files that do not exist', () => {
    const watchman = require('../crawlers/watchman');
    // getMockImplementation should be a public method.
    const mockImpl = watchman._getMockImplementation();
    // Wrap the watchman mock and add an invalid file to the file list.
    watchman.mockImplementation((roots, extensions, ignore, data) => {
      return mockImpl(roots, extensions, ignore, data).then(() => {
        data.files['/fruits/invalid/file.js'] = ['', 34, 0, []];
        return data;
      });
    });
    return new HasteMap(defaultConfig).build().then(data => {
      expect(Object.keys(data.files).length).toBe(5);

      // Ensure this file is not part of the file list.
      expect(data.files['/fruits/invalid/file.js']).toBe(undefined);
    });
  });

  it('distributes work across workers', () => {
    const workerFarm = require('worker-farm');
    return new HasteMap(Object.assign({}, defaultConfig, {
      maxWorkers: 4,
    })).build().then(data => {
      expect(workerFarm.mock.calls.length).toBe(1);

      expect(workerFarmMock.mock.calls.length).toBe(5);

      expect(workerFarmMock.mock.calls).toEqual([
        [{filePath: '/fruits/pear.js'}, jasmine.any(Function)],
        [{filePath: '/fruits/banana.js'}, jasmine.any(Function)],
        [{filePath: '/fruits/strawberry.js'}, jasmine.any(Function)],
        [{filePath: '/vegetables/melon.js'}, jasmine.any(Function)],
        [{filePath: '/fruits/__mocks__/Pear.js'}, jasmine.any(Function)],
      ]);

      expect(workerFarm.end).toBeCalledWith(workerFarmMock);
    });
  });

  it('tries to crawl using node as a fallback', () => {
    const watchman = require('../crawlers/watchman');
    const node = require('../crawlers/node');

    watchman.mockImplementation(() => {
      throw new Error('watchman error');
    });
    node.mockImplementation((roots, extensions, ignore, data) => {
      data.files = object({
        '/fruits/banana.js': ['', 32, 0, []],
      });
      return Promise.resolve(data);
    });

    return new HasteMap(defaultConfig).build().then(data => {
      expect(watchman).toBeCalled();
      expect(node).toBeCalled();

      expect(data.files).toEqual({
        '/fruits/banana.js': ['Banana', 32, 1, ['Strawberry']],
      });

      expect(console.warn).toBeCalledWith(
        'jest-haste-map: Watchman crawl failed. Retrying once with node ' +
        'crawler.\n  Error: watchman error'
      );
    });
  });

  it('tries to crawl using node as a fallback when promise fails once', () => {
    const watchman = require('../crawlers/watchman');
    const node = require('../crawlers/node');

    watchman.mockImplementation(() => {
      return Promise.reject(new Error('watchman error'));
    });
    node.mockImplementation((roots, extensions, ignore, data) => {
      data.files = object({
        '/fruits/banana.js': ['', 32, 0, []],
      });
      return Promise.resolve(data);
    });

    return new HasteMap(defaultConfig).build().then(data => {
      expect(watchman).toBeCalled();
      expect(node).toBeCalled();

      expect(data.files).toEqual({
        '/fruits/banana.js': ['Banana', 32, 1, ['Strawberry']],
      });
    });
  });

  it('stops crawling when both crawlers fail', () => {
    const watchman = require('../crawlers/watchman');
    const node = require('../crawlers/node');

    watchman.mockImplementation(() => {
      return Promise.reject(new Error('watchman error'));
    });

    node.mockImplementation((roots, extensions, ignore, data) => {
      return Promise.reject(new Error('node error'));
    });

    return new HasteMap(defaultConfig).build()
      .then(
        () => expect(() => {}).toThrow(),
        error => {
          expect(error.message).toEqual(
            'Crawler retry failed:\n' +
            '  Original error: watchman error\n' +
            '  Retry error: node error\n'
          );
        }
      );
  });

});
