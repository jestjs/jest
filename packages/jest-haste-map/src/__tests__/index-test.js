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

jest.mock('child_process', () => ({
  // If this does not throw, we'll use the (mocked) watchman crawler
  execSync() {},
}));

jest.mock('worker-farm', () => {
  const mock = jest.fn(
    (options, worker) => workerFarmMock = jest.fn(
      (data, callback) => require(worker)(data, callback),
    ),
  );
  mock.end = jest.fn();
  return mock;
});

jest.mock('../crawlers/node');
jest.mock('../crawlers/watchman', () =>
  jest.fn(options => {
    const {
      data,
      ignore,
      roots,
    } = options;
    data.clocks = mockClocks;

    const list = mockChangedFiles || mockFs;
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
  }),
);

jest.mock('sane', () => {
  const watcher = jest.fn(root => {
    const EventEmitter = require('events').EventEmitter;
    mockEmitters[root] = new EventEmitter();
    mockEmitters[root].close = jest.fn(callback => callback());
    setTimeout(() => mockEmitters[root].emit('ready'), 0);
    return mockEmitters[root];
  });
  return {
    NodeWatcher: watcher,
    WatchmanWatcher: watcher,
  };
});

const skipOnWindows = require('skipOnWindows');

const cacheFilePath = '/cache-file';
let consoleWarn;
let defaultConfig;
let fs;
let H;
let HasteMap;
let mockChangedFiles;
let mockClocks;
let mockEmitters;
let mockFs;
let object;
let readFileSync;
let workerFarmMock;
let writeFileSync;

describe('HasteMap', () => {
  skipOnWindows.suite();

  beforeEach(() => {
    jest.resetModules();

    object = data => Object.assign(Object.create(null), data);

    mockEmitters = Object.create(null);
    mockFs = object({
      '/fruits/__mocks__/Pear.js': [
        'const Melon = require("Melon");',
      ].join('\n'),
      '/fruits/banana.js': [
        '/**',
        ' * @providesModule Banana',
        ' */',
        'const Strawberry = require("Strawberry");',
      ].join('\n'),
      '/fruits/kiwi.js': [
        '/**',
        ' * @providesModule Kiwi',
        ' */',
      ].join('\n'),
      '/fruits/pear.js': [
        '/**',
        ' * @providesModule Pear',
        ' */',
        'const Banana = require("Banana");',
        'const Strawberry = require("Strawberry");',
      ].join('\n'),
      '/fruits/strawberry.js': [
        '/**',
        ' * @providesModule Strawberry',
        ' */',
      ].join('\n'),
      '/vegetables/melon.js': [
        '/**',
        ' * @providesModule Melon',
        ' */',
      ].join('\n'),
    });
    mockClocks = object({
      '/fruits': 'c:fake-clock:1',
      '/vegetables': 'c:fake-clock:2',
    });

    mockChangedFiles = null;

    fs = require('graceful-fs');
    readFileSync = fs.readFileSync;
    writeFileSync = fs.writeFileSync;
    fs.readFileSync = jest.fn((path, options) => {
      expect(options).toBe('utf8');

      // A file change can be triggered by writing into the
      // mockChangedFiles object.
      if (mockChangedFiles && (path in mockChangedFiles)) {
        return mockChangedFiles[path];
      }

      if (mockFs[path]) {
        return mockFs[path];
      }

      throw new Error(`Cannot read path '${path}'.`);
    });
    fs.writeFileSync = jest.fn((path, data, options) => {
      expect(options).toBe('utf8');
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

  it('exports constants', () => {
    expect(HasteMap.H).toBe(require('../constants'));
  });

  it('creates valid cache file paths', () => {
    jest.resetModuleRegistry();
    HasteMap = require('../');

    expect(HasteMap.getCacheFilePath('/', '@scoped/package', 'random-value'))
      .toMatch(/^\/-scoped-package-(.*)$/);

    expect(
      HasteMap.getCacheFilePath('/', '@scoped/package', 'random-value'),
    ).not.toEqual(
      HasteMap.getCacheFilePath('/', '-scoped-package', 'random-value'),
    );
  });

  it('matches files against a pattern', () => {
    return new HasteMap(defaultConfig).build().then(({hasteFS}) => {
      expect(hasteFS.matchFiles(/fruits/)).toEqual([
        '/fruits/__mocks__/Pear.js',
        '/fruits/banana.js',
        '/fruits/pear.js',
        '/fruits/strawberry.js',
      ]);

      expect(hasteFS.matchFiles(/__mocks__/)).toEqual([
        '/fruits/__mocks__/Pear.js',
      ]);
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
    mockFs['/fruits/node_modules/fbjs2/index.js'] = [
      '/**',
      ' * @providesModule fbjs2',
      ' */',
    ].join('\n');

    const hasteMap = new HasteMap(Object.assign({}, defaultConfig, {
      mocksPattern: '/__mocks__/',
      providesModuleNodeModules: ['react', 'fbjs'],
    }));

    return hasteMap.build().then(({__hasteMapForTest: data}) => {
      expect(data.clocks).toEqual(mockClocks);

      expect(data.files).toEqual({
        '/fruits/__mocks__/Pear.js': ['', 32, 1, ['Melon']],
        '/fruits/banana.js': ['Banana', 32, 1, ['Strawberry']],
        // node modules
        '/fruits/node_modules/fbjs/lib/flatMap.js': ['flatMap', 32, 1, []],
        '/fruits/node_modules/react/react.js': ['React', 32, 1, ['Component']],

        '/fruits/pear.js': ['Pear', 32, 1, ['Banana', 'Strawberry']],
        '/fruits/strawberry.js': ['Strawberry', 32, 1, []],
        '/vegetables/melon.js': ['Melon', 32, 1, []],
      });

      expect(data.map).toEqual({
        'Banana': {[H.GENERIC_PLATFORM]: ['/fruits/banana.js', H.MODULE]},
        'Melon': {[H.GENERIC_PLATFORM]: ['/vegetables/melon.js', H.MODULE]},
        'Pear': {[H.GENERIC_PLATFORM]: ['/fruits/pear.js', H.MODULE]},
        'React': {
          [H.GENERIC_PLATFORM]: [
            '/fruits/node_modules/react/react.js',
            H.MODULE,
          ],
        },
        'Strawberry': {
          [H.GENERIC_PLATFORM]: ['/fruits/strawberry.js', H.MODULE],
        },
        'flatMap': {
          [H.GENERIC_PLATFORM]: [
            '/fruits/node_modules/fbjs/lib/flatMap.js',
            H.MODULE,
          ],
        },
      });

      expect(data.mocks).toEqual({
        'Pear': '/fruits/__mocks__/Pear.js',
      });

      // The cache file must exactly mirror the data structure returned
      // from a build.
      expect(hasteMap.read()).toEqual(data);
    });
  });

  it('retains all files if `retainAllFiles` is specified', () => {
    mockFs['/fruits/node_modules/fbjs/index.js'] = [
      '/**',
      ' * @providesModule fbjs',
      ' */',
    ].join('\n');

    const hasteMap = new HasteMap(Object.assign({}, defaultConfig, {
      mocksPattern: '/__mocks__/',
      retainAllFiles: true,
    }));

    return hasteMap.build().then(({__hasteMapForTest: data}) => {
      // Expect the node module to be part of files but make sure it wasn't
      // read.
      expect(
        data.files['/fruits/node_modules/fbjs/index.js'],
      ).toEqual(['', 32, 0, []]);

      expect(data.map.fbjs).not.toBeDefined();

      // cache file + 5 modules - the node_module
      expect(fs.readFileSync.mock.calls.length).toBe(6);
    });
  });

  it('warns on duplicate mock files', () => {
    // Duplicate mock files for blueberry
    mockFs['/fruits1/__mocks__/subdir/blueberry.js'] = [
      '/**',
      ' * @providesModule Blueberry1',
      ' */',
    ].join('\n');
    mockFs['/fruits2/__mocks__/subdir/blueberry.js'] = [
      '/**',
      ' * @providesModule Blueberry2',
      ' */',
    ].join('\n');

    return new HasteMap(
      Object.assign({mocksPattern: '__mocks__'}, defaultConfig),
    ).build()
      .then(({__hasteMapForTest: data}) => {
        expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
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

    return new HasteMap(defaultConfig).build()
      .then(({__hasteMapForTest: data}) => {
        expect(data.map.Strawberry[H.GENERIC_PLATFORM][0])
          .toEqual('/fruits/raspberry.js');

        expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
      });
  });

  it('throws on duplicate module ids if "throwOnModuleCollision" is set to true', () => {
    // Raspberry thinks it is a Strawberry
    mockFs['/fruits/raspberry.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Banana = require("Banana");',
    ].join('\n');

    return new HasteMap(
      Object.assign({throwOnModuleCollision: true}, defaultConfig),
    ).build().catch(err => {
      expect(err).toMatchSnapshot();
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

    return new HasteMap(defaultConfig).build()
      .then(({__hasteMapForTest: data}) => {
        expect(data.files).toEqual({
          '/fruits/strawberry.android.js':
            ['Strawberry', 32, 1, ['Blackberry']],
          '/fruits/strawberry.ios.js': ['Strawberry', 32, 1, ['Raspberry']],
          '/fruits/strawberry.js': ['Strawberry', 32, 1, ['Banana']],
        });

        expect(data.map).toEqual({
          'Strawberry': {
            [H.GENERIC_PLATFORM]: ['/fruits/strawberry.js', H.MODULE],
            'android': ['/fruits/strawberry.android.js', H.MODULE],
            'ios': ['/fruits/strawberry.ios.js', H.MODULE],
          },
        });
      });
  });

  it('does not access the file system on a warm cache with no changes', () => {
    return new HasteMap(defaultConfig).build()
      .then(({__hasteMapForTest: initialData}) => {
        // The first run should access the file system once for the (empty)
        // cache file and five times for the files in the system.
        expect(fs.readFileSync.mock.calls.length).toBe(6);

        fs.readFileSync.mockClear();

        // Explicitly mock that no files have changed.
        mockChangedFiles = Object.create(null);

        // Watchman would give us different clocks.
        mockClocks = object({
          '/fruits': 'c:fake-clock:3',
          '/vegetables': 'c:fake-clock:4',
        });

        return new HasteMap(defaultConfig).build()
          .then(({__hasteMapForTest: data}) => {
            expect(fs.readFileSync.mock.calls.length).toBe(1);
            expect(fs.readFileSync).toBeCalledWith(cacheFilePath, 'utf8');

            expect(data.clocks).toEqual(mockClocks);
            expect(data.files).toEqual(initialData.files);
            expect(data.map).toEqual(initialData.map);
          });
      });
  });

  it('only does minimal file system access when files change', () => {
    return new HasteMap(defaultConfig).build()
      .then(({__hasteMapForTest: initialData}) => {
        fs.readFileSync.mockClear();

        // Let's assume one JS file has changed.
        mockChangedFiles = object({
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

        return new HasteMap(defaultConfig).build()
          .then(({__hasteMapForTest: data}) => {
            expect(fs.readFileSync.mock.calls.length).toBe(2);

            expect(fs.readFileSync).toBeCalledWith(cacheFilePath, 'utf8');
            expect(fs.readFileSync).toBeCalledWith('/fruits/banana.js', 'utf8');

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
    return new HasteMap(defaultConfig).build()
      .then(({__hasteMapForTest: initialData}) => {
        fs.readFileSync.mockClear();

        // Let's assume one JS file was removed.
        delete mockFs['/fruits/banana.js'];
        mockChangedFiles = object({
          '/fruits/banana.js': null,
        });

        // Watchman would give us different clocks for `/fruits`.
        mockClocks = object({
          '/fruits': 'c:fake-clock:3',
          '/vegetables': 'c:fake-clock:2',
        });

        return new HasteMap(defaultConfig).build()
          .then(({__hasteMapForTest: data}) => {
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
    const mockImpl = watchman.getMockImplementation();
    // Wrap the watchman mock and add an invalid file to the file list.
    watchman.mockImplementation(options => {
      return mockImpl(options).then(() => {
        const {data} = options;
        data.files['/fruits/invalid/file.js'] = ['', 34, 0, []];
        return data;
      });
    });
    return new HasteMap(defaultConfig).build()
      .then(({__hasteMapForTest: data}) => {
        expect(Object.keys(data.files).length).toBe(5);

        // Ensure this file is not part of the file list.
        expect(data.files['/fruits/invalid/file.js']).toBe(undefined);
      });
  });

  it('distributes work across workers', () => {
    const workerFarm = require('worker-farm');
    return new HasteMap(Object.assign({}, defaultConfig, {
      maxWorkers: 4,
    })).build().then(({__hasteMapForTest: data}) => {
      expect(workerFarm.mock.calls.length).toBe(1);

      expect(workerFarmMock.mock.calls.length).toBe(5);

      expect(workerFarmMock.mock.calls).toEqual([
        [{filePath: '/fruits/__mocks__/Pear.js'}, jasmine.any(Function)],
        [{filePath: '/fruits/banana.js'}, jasmine.any(Function)],
        [{filePath: '/fruits/pear.js'}, jasmine.any(Function)],
        [{filePath: '/fruits/strawberry.js'}, jasmine.any(Function)],
        [{filePath: '/vegetables/melon.js'}, jasmine.any(Function)],
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
    node.mockImplementation(options => {
      const {data} = options;
      data.files = object({
        '/fruits/banana.js': ['', 32, 0, []],
      });
      return Promise.resolve(data);
    });

    return new HasteMap(defaultConfig).build()
      .then(({__hasteMapForTest: data}) => {
        expect(watchman).toBeCalled();
        expect(node).toBeCalled();

        expect(data.files).toEqual({
          '/fruits/banana.js': ['Banana', 32, 1, ['Strawberry']],
        });

        expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
      });
  });

  it('tries to crawl using node as a fallback when promise fails once', () => {
    const watchman = require('../crawlers/watchman');
    const node = require('../crawlers/node');

    watchman.mockImplementation(() => {
      return Promise.reject(new Error('watchman error'));
    });
    node.mockImplementation(options => {
      const {data} = options;
      data.files = object({
        '/fruits/banana.js': ['', 32, 0, []],
      });
      return Promise.resolve(data);
    });

    return new HasteMap(defaultConfig).build().then(
      ({__hasteMapForTest: data}) => {
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

    watchman.mockImplementation(() =>
      Promise.reject(new Error('watchman error')),
    );

    node.mockImplementation((roots, extensions, ignore, data) =>
      Promise.reject(new Error('node error')),
    );

    return new HasteMap(defaultConfig).build()
      .then(
        () => expect(() => {}).toThrow(),
        error => {
          expect(error.message).toEqual(
            'Crawler retry failed:\n' +
            '  Original error: watchman error\n' +
            '  Retry error: node error\n',
          );
        },
      );
  });

  it('watches for file system changes', done => {
    const hasteMap = new HasteMap(Object.assign({}, defaultConfig, {
      watch: true,
    }));

    const addErrorHandler = fn => {
      return function() {
        try {
          fn.apply(null, arguments);
        } catch (error) {
          hasteMap.end();
          done.fail(error);
        }
      };
    };

    hasteMap.build()
      .then(({hasteFS: initialHasteFS, moduleMap: initialModuleMap}) => {
        const filePath = '/fruits/banana.js';
        expect(initialHasteFS.getModuleName(filePath)).toBeDefined();
        expect(initialModuleMap.getModule('Banana')).toBe(filePath);

        const next = () => {
          if (!tests.length) {
            hasteMap.end();
            done();
            return;
          }

          tests.shift()();
        };

        const statObject = {mtime: {getTime: () => 45}};
        const tests = [
          () => {
            // Tests that the change event works correctly.
            mockEmitters['/fruits'].emit(
              'all',
              'delete',
              'banana.js',
              '/fruits',
              undefined,
            );
            mockEmitters['/fruits'].emit(
              'all',
              'delete',
              'banana.js',
              '/fruits',
              undefined,
            );

            hasteMap.once(
              'change',
              addErrorHandler(({eventsQueue, hasteFS, moduleMap}) => {
                expect(eventsQueue).toHaveLength(1);

                expect(eventsQueue).toEqual([{
                  filePath,
                  stat: undefined,
                  type: 'delete',
                }]);
                // Verify we didn't change the original map.
                expect(initialHasteFS.getModuleName(filePath)).toBeDefined();
                expect(initialModuleMap.getModule('Banana')).toBe(filePath);

                expect(hasteFS.getModuleName(filePath)).toBeNull();
                expect(moduleMap.getModule('Banana')).toBeNull();

                next();
              }),
            );
          },
          () => {
            // Ensures the event queue can receive multiple events.
            mockFs['/fruits/tomato.js'] = [
              '/**',
              ' * @providesModule Tomato',
              ' */',
            ].join('\n');
            mockFs['/fruits/pear.js'] = [
              '/**',
              ' * @providesModule Kiwi',
              ' */',
            ].join('\n');

            mockEmitters['/fruits'].emit(
              'all',
              'add',
              'tomato.js',
              '/fruits',
              statObject,
            );
            mockEmitters['/fruits'].emit(
              'all',
              'change',
              'pear.js',
              '/fruits',
              statObject,
            );

            hasteMap.once(
              'change',
              addErrorHandler(({eventsQueue, hasteFS, moduleMap}) => {
                expect(eventsQueue).toEqual([
                  {
                    filePath: '/fruits/tomato.js',
                    stat: statObject,
                    type: 'add',
                  },
                  {
                    filePath: '/fruits/pear.js',
                    stat: statObject,
                    type: 'change',
                  },
                ]);

                expect(hasteFS.getModuleName('/fruits/tomato.js'))
                  .toBeDefined();
                expect(moduleMap.getModule('Tomato')).toBeDefined();
                expect(moduleMap.getModule('Pear')).toBeNull();
                expect(moduleMap.getModule('Kiwi')).toBe('/fruits/pear.js');
                next();
              }),
            );
          },
          () => {
            // Does not emit duplicate change events.
            mockEmitters['/fruits'].emit(
              'all',
              'change',
              'tomato.js',
              '/fruits',
              statObject,
            );
            mockEmitters['/fruits'].emit(
              'all',
              'change',
              'tomato.js',
              '/fruits',
              statObject,
            );
            hasteMap.once(
              'change',
              addErrorHandler(({eventsQueue, hasteFS, moduleMap}) => {
                expect(eventsQueue).toHaveLength(1);
                next();
              }),
            );
          },
          () => {
            // Emits a change even if a file in node_modules has changed.
            mockEmitters['/fruits'].emit(
              'all',
              'add',
              'apple.js',
              '/fruits/node_modules/',
              statObject,
            );
            hasteMap.once(
              'change',
              addErrorHandler(({eventsQueue, hasteFS, moduleMap}) => {
                const filePath = '/fruits/node_modules/apple.js';
                expect(eventsQueue).toHaveLength(1);
                expect(eventsQueue).toEqual([{
                  filePath,
                  stat: statObject,
                  type: 'add',
                }]);

                expect(hasteFS.getModuleName(filePath)).toBeDefined();
                next();
              }),
            );
          },
        ];

        next();
      })
      .catch(addErrorHandler(error => {
        throw error;
      }));
  });

});
