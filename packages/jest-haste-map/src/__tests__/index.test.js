/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import {skipSuiteOnWindows} from '../../../../scripts/ConditionalTest';
const crypto = require('crypto');

function mockHashContents(contents) {
  return crypto
    .createHash('sha1')
    .update(contents)
    .digest('hex');
}

jest.mock('child_process', () => ({
  // If this does not throw, we'll use the (mocked) watchman crawler
  execSync() {},
}));

jest.mock('jest-worker', () =>
  jest.fn(worker => {
    mockWorker = jest.fn((...args) => require(worker).worker(...args));
    mockEnd = jest.fn();

    return {
      end: mockEnd,
      worker: mockWorker,
    };
  }),
);

jest.mock('../crawlers/node');
jest.mock('../crawlers/watchman', () =>
  jest.fn(options => {
    const path = require('path');

    const {data, ignore, rootDir, roots, computeSha1} = options;
    const list = mockChangedFiles || mockFs;

    data.clocks = mockClocks;

    for (const file in list) {
      if (new RegExp(roots.join('|')).test(file) && !ignore(file)) {
        const relativeFilePath = path.relative(rootDir, file);
        if (list[file]) {
          const hash = computeSha1 ? mockHashContents(list[file]) : null;

          data.files.set(relativeFilePath, ['', 32, 0, [], hash]);
        } else {
          data.files.delete(relativeFilePath);
        }
      }
    }

    return Promise.resolve(data);
  }),
);

const mockWatcherConstructor = jest.fn(root => {
  const EventEmitter = require('events').EventEmitter;
  mockEmitters[root] = new EventEmitter();
  mockEmitters[root].close = jest.fn(callback => callback());
  setTimeout(() => mockEmitters[root].emit('ready'), 0);
  return mockEmitters[root];
});

jest.mock('sane', () => ({
  NodeWatcher: mockWatcherConstructor,
  WatchmanWatcher: mockWatcherConstructor,
}));

jest.mock('../lib/watchman_watcher.js', () => mockWatcherConstructor);

let mockChangedFiles;
let mockFs;

jest.mock('graceful-fs', () => ({
  readFileSync: jest.fn((path, options) => {
    // A file change can be triggered by writing into the
    // mockChangedFiles object.
    if (mockChangedFiles && path in mockChangedFiles) {
      return mockChangedFiles[path];
    }

    if (mockFs[path]) {
      return mockFs[path];
    }

    const error = new Error(`Cannot read path '${path}'.`);
    error.code = 'ENOENT';
    throw error;
  }),
  writeFileSync: jest.fn((path, data, options) => {
    expect(options).toBe(require('v8').serialize ? undefined : 'utf8');
    mockFs[path] = data;
  }),
}));
jest.mock('fs', () => require('graceful-fs'));

const cacheFilePath = '/cache-file';
const object = data => Object.assign(Object.create(null), data);
const createMap = obj => new Map(Object.keys(obj).map(key => [key, obj[key]]));

// Jest toEqual does not match Map instances from different contexts
const normalizePersisted = hasteMap => ({
  clocks: normalizeMap(hasteMap.clocks),
  duplicates: normalizeMap(hasteMap.duplicates),
  files: normalizeMap(hasteMap.files),
  map: normalizeMap(hasteMap.map),
  mocks: normalizeMap(hasteMap.mocks),
});
const normalizeMap = map => {
  if (Object.prototype.toString.call(map) !== '[object Map]') {
    throw new TypeError('expected map instance');
  }
  return new Map(map);
};

let consoleWarn;
let defaultConfig;
let fs;
let H;
let HasteMap;
let mockClocks;
let mockEmitters;
let mockEnd;
let mockWorker;
let getCacheFilePath;

describe('HasteMap', () => {
  skipSuiteOnWindows();

  beforeEach(() => {
    jest.resetModules();

    mockEmitters = Object.create(null);
    mockFs = object({
      '/project/fruits/__mocks__/Pear.js': [
        'const Melon = require("Melon");',
      ].join('\n'),
      '/project/fruits/banana.js': [
        '/**',
        ' * @providesModule Banana',
        ' */',
        'const Strawberry = require("Strawberry");',
      ].join('\n'),
      '/project/fruits/kiwi.js': ['/**', ' * @providesModule Kiwi', ' */'].join(
        '\n',
      ),
      '/project/fruits/pear.js': [
        '/**',
        ' * @providesModule Pear',
        ' */',
        'const Banana = require("Banana");',
        'const Strawberry = require("Strawberry");',
      ].join('\n'),
      '/project/fruits/strawberry.js': [
        '/**',
        ' * @providesModule Strawberry',
        ' */',
      ].join('\n'),
      '/project/vegetables/melon.js': [
        '/**',
        ' * @providesModule Melon',
        ' */',
      ].join('\n'),
      '/project/video/video.mp4': Buffer.from([
        0xfa,
        0xce,
        0xb0,
        0x0c,
      ]).toString(),
    });
    mockClocks = createMap({
      fruits: 'c:fake-clock:1',
      vegetables: 'c:fake-clock:2',
      video: 'c:fake-clock:3',
    });

    mockChangedFiles = null;

    fs = require('graceful-fs');

    consoleWarn = console.warn;
    console.warn = jest.fn();

    HasteMap = require('../');
    H = HasteMap.H;

    getCacheFilePath = HasteMap.getCacheFilePath;
    HasteMap.getCacheFilePath = jest.fn(() => cacheFilePath);

    defaultConfig = {
      extensions: ['js', 'json'],
      ignorePattern: /kiwi/,
      maxWorkers: 1,
      name: 'haste-map-test',
      platforms: ['ios', 'android'],
      resetCache: false,
      rootDir: '/project',
      roots: ['/project/fruits', '/project/vegetables'],
      useWatchman: true,
    };
  });

  afterEach(() => {
    console.warn = consoleWarn;
  });

  it('exports constants', () => {
    expect(HasteMap.H).toBe(require('../constants').default);
  });

  it('creates valid cache file paths', () => {
    jest.resetModuleRegistry();
    HasteMap = require('../');

    expect(
      HasteMap.getCacheFilePath('/', '@scoped/package', 'random-value'),
    ).toMatch(/^\/-scoped-package-(.*)$/);

    expect(
      HasteMap.getCacheFilePath('/', '@scoped/package', 'random-value'),
    ).not.toEqual(
      HasteMap.getCacheFilePath('/', '-scoped-package', 'random-value'),
    );
  });

  it('matches files against a pattern', () =>
    new HasteMap(defaultConfig).build().then(({hasteFS}) => {
      expect(hasteFS.matchFiles(/project\/fruits/)).toEqual([
        '/project/fruits/__mocks__/Pear.js',
        '/project/fruits/banana.js',
        '/project/fruits/pear.js',
        '/project/fruits/strawberry.js',
      ]);

      expect(hasteFS.matchFiles(/__mocks__/)).toEqual([
        '/project/fruits/__mocks__/Pear.js',
      ]);
    }));

  it('builds a haste map on a fresh cache', () => {
    // Include these files in the map
    mockFs['/project/fruits/node_modules/react/react.js'] = [
      '/**',
      ' * @providesModule React',
      ' */',
      'const Component = require("Component");',
    ].join('\n');
    mockFs['/project/fruits/node_modules/fbjs/lib/flatMap.js'] = [
      '/**',
      ' * @providesModule flatMap',
      ' */',
    ].join('\n');

    // Ignore these
    mockFs[
      '/project/fruits/node_modules/react/node_modules/fbjs/lib/mapObject.js'
    ] = ['/**', ' * @providesModule mapObject', ' */'].join('\n');
    mockFs['/project/fruits/node_modules/react/node_modules/dummy/merge.js'] = [
      '/**',
      ' * @providesModule merge',
      ' */',
    ].join('\n');
    mockFs[
      '/project/fruits/node_modules/react/node_modules/merge/package.json'
    ] = ['{', '  "name": "merge"', '}'].join('\n');
    mockFs['/project/fruits/node_modules/jest/jest.js'] = [
      '/**',
      ' * @providesModule Jest',
      ' */',
      'const Test = require("Test");',
    ].join('\n');
    mockFs['/project/fruits/node_modules/fbjs2/index.js'] = [
      '/**',
      ' * @providesModule fbjs2',
      ' */',
    ].join('\n');

    const hasteMap = new HasteMap(
      Object.assign({}, defaultConfig, {
        mocksPattern: '/__mocks__/',
        providesModuleNodeModules: ['react', 'fbjs'],
      }),
    );

    return hasteMap.build().then(({__hasteMapForTest: data}) => {
      expect(data.clocks).toEqual(mockClocks);

      expect(data.files).toEqual(
        createMap({
          'fruits/__mocks__/Pear.js': ['', 32, 1, ['Melon'], null],
          'fruits/banana.js': ['Banana', 32, 1, ['Strawberry'], null],
          // node modules
          'fruits/node_modules/fbjs/lib/flatMap.js': [
            'flatMap',
            32,
            1,
            [],
            null,
          ],
          'fruits/node_modules/react/react.js': [
            'React',
            32,
            1,
            ['Component'],
            null,
          ],

          'fruits/pear.js': ['Pear', 32, 1, ['Banana', 'Strawberry'], null],
          'fruits/strawberry.js': ['Strawberry', 32, 1, [], null],
          'vegetables/melon.js': ['Melon', 32, 1, [], null],
        }),
      );

      expect(data.map).toEqual(
        createMap({
          Banana: {[H.GENERIC_PLATFORM]: ['fruits/banana.js', H.MODULE]},
          Melon: {[H.GENERIC_PLATFORM]: ['vegetables/melon.js', H.MODULE]},
          Pear: {[H.GENERIC_PLATFORM]: ['fruits/pear.js', H.MODULE]},
          React: {
            [H.GENERIC_PLATFORM]: [
              'fruits/node_modules/react/react.js',
              H.MODULE,
            ],
          },
          Strawberry: {
            [H.GENERIC_PLATFORM]: ['fruits/strawberry.js', H.MODULE],
          },
          flatMap: {
            [H.GENERIC_PLATFORM]: [
              'fruits/node_modules/fbjs/lib/flatMap.js',
              H.MODULE,
            ],
          },
        }),
      );

      expect(data.mocks).toEqual(
        createMap({
          Pear: 'fruits/__mocks__/Pear.js',
        }),
      );

      // The cache file must exactly mirror the data structure returned from a
      // build
      expect(normalizePersisted(hasteMap.read())).toEqual(data);
    });
  });

  describe('builds a haste map on a fresh cache with SHA-1s', () => {
    [false, true].forEach(useWatchman => {
      it('uses watchman: ' + useWatchman, async () => {
        const node = require('../crawlers/node');

        node.mockImplementation(options => {
          const {data} = options;

          // The node crawler returns "null" for the SHA-1.
          data.files = createMap({
            'fruits/__mocks__/Pear.js': ['', 32, 0, ['Melon'], null],
            'fruits/banana.js': ['Banana', 32, 0, ['Strawberry'], null],
            'fruits/pear.js': ['Pear', 32, 0, ['Banana', 'Strawberry'], null],
            'fruits/strawberry.js': ['Strawberry', 32, 0, [], null],
            'vegetables/melon.js': ['Melon', 32, 0, [], null],
          });

          return Promise.resolve(data);
        });

        const hasteMap = new HasteMap(
          Object.assign({}, defaultConfig, {
            computeSha1: true,
            maxWorkers: 1,
            useWatchman,
          }),
        );

        const data = (await hasteMap.build()).__hasteMapForTest;

        expect(data.files).toEqual(
          createMap({
            'fruits/__mocks__/Pear.js': [
              '',
              32,
              1,
              ['Melon'],
              'a315b7804be2b124b77c1f107205397f45226964',
            ],
            'fruits/banana.js': [
              'Banana',
              32,
              1,
              ['Strawberry'],
              'f24c6984cce6f032f6d55d771d04ab8dbbe63c8c',
            ],
            'fruits/pear.js': [
              'Pear',
              32,
              1,
              ['Banana', 'Strawberry'],
              '211a8ff1e67007b204727d26943c15cf9fd00031',
            ],
            'fruits/strawberry.js': [
              'Strawberry',
              32,
              1,
              [],
              'd55d545ad7d997cb2aa10fb412e0cc287d4fbfb3',
            ],
            'vegetables/melon.js': [
              'Melon',
              32,
              1,
              [],
              '45c5d30e29313187829dfd5a16db81c3143fbcc7',
            ],
          }),
        );

        expect(normalizePersisted(hasteMap.read())).toEqual(data);
      });
    });
  });

  it('does not crawl native files even if requested to do so', async () => {
    mockFs['/project/video/i-require-a-video.js'] = [
      '/**',
      ' * @providesModule IRequireAVideo',
      ' */',
      'module.exports = require("./video.mp4");',
    ].join('\n');

    const hasteMap = new HasteMap(
      Object.assign({}, defaultConfig, {
        extensions: [...defaultConfig.extensions],
        roots: [...defaultConfig.roots, '/project/video'],
      }),
    );

    const {__hasteMapForTest: data} = await hasteMap.build();

    expect(data.map.get('IRequireAVideo')).toBeDefined();
    expect(data.files.get('video/video.mp4')).toBeDefined();
    expect(fs.readFileSync).not.toBeCalledWith('video/video.mp4', 'utf8');
  });

  it('retains all files if `retainAllFiles` is specified', () => {
    mockFs['/project/fruits/node_modules/fbjs/index.js'] = [
      '/**',
      ' * @providesModule fbjs',
      ' */',
    ].join('\n');

    const hasteMap = new HasteMap(
      Object.assign({}, defaultConfig, {
        mocksPattern: '/__mocks__/',
        retainAllFiles: true,
      }),
    );

    return hasteMap.build().then(({__hasteMapForTest: data}) => {
      // Expect the node module to be part of files but make sure it wasn't
      // read.
      expect(data.files.get('fruits/node_modules/fbjs/index.js')).toEqual([
        '',
        32,
        0,
        [],
        null,
      ]);

      expect(data.map.get('fbjs')).not.toBeDefined();

      // cache file + 5 modules - the node_module
      expect(fs.readFileSync.mock.calls.length).toBe(6);
    });
  });

  it('warns on duplicate mock files', () => {
    // Duplicate mock files for blueberry
    mockFs['/project/fruits1/__mocks__/subdir/blueberry.js'] = [
      '/**',
      ' * @providesModule Blueberry1',
      ' */',
    ].join('\n');
    mockFs['/project/fruits2/__mocks__/subdir/blueberry.js'] = [
      '/**',
      ' * @providesModule Blueberry2',
      ' */',
    ].join('\n');

    return new HasteMap(
      Object.assign({mocksPattern: '__mocks__'}, defaultConfig),
    )
      .build()
      .then(({__hasteMapForTest: data}) => {
        expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
      });
  });

  it('warns on duplicate module ids', () => {
    // Raspberry thinks it is a Strawberry
    mockFs['/project/fruits/raspberry.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Banana = require("Banana");',
    ].join('\n');

    return new HasteMap(defaultConfig)
      .build()
      .then(({__hasteMapForTest: data}) => {
        // Duplicate modules are removed so that it doesn't cause
        // non-determinism later on.
        expect(
          data.map.get('Strawberry')[H.GENERIC_PLATFORM],
        ).not.toBeDefined();

        expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
      });
  });

  it('throws on duplicate module ids if "throwOnModuleCollision" is set to true', () => {
    // Raspberry thinks it is a Strawberry
    mockFs['/project/fruits/raspberry.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Banana = require("Banana");',
    ].join('\n');

    return new HasteMap(
      Object.assign({throwOnModuleCollision: true}, defaultConfig),
    )
      .build()
      .catch(err => {
        expect(err).toMatchSnapshot();
      });
  });

  it('splits up modules by platform', () => {
    mockFs = Object.create(null);
    mockFs['/project/fruits/strawberry.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Banana = require("Banana");',
    ].join('\n');

    mockFs['/project/fruits/strawberry.ios.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Raspberry = require("Raspberry");',
    ].join('\n');

    mockFs['/project/fruits/strawberry.android.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Blackberry = require("Blackberry");',
    ].join('\n');

    return new HasteMap(defaultConfig)
      .build()
      .then(({__hasteMapForTest: data}) => {
        expect(data.files).toEqual(
          createMap({
            'fruits/strawberry.android.js': [
              'Strawberry',
              32,
              1,
              ['Blackberry'],
              null,
            ],
            'fruits/strawberry.ios.js': [
              'Strawberry',
              32,
              1,
              ['Raspberry'],
              null,
            ],
            'fruits/strawberry.js': ['Strawberry', 32, 1, ['Banana'], null],
          }),
        );

        expect(data.map).toEqual(
          createMap({
            Strawberry: {
              [H.GENERIC_PLATFORM]: ['fruits/strawberry.js', H.MODULE],
              android: ['fruits/strawberry.android.js', H.MODULE],
              ios: ['fruits/strawberry.ios.js', H.MODULE],
            },
          }),
        );
      });
  });

  it('does not access the file system on a warm cache with no changes', () =>
    new HasteMap(defaultConfig)
      .build()
      .then(({__hasteMapForTest: initialData}) => {
        // The first run should access the file system once for the (empty)
        // cache file and five times for the files in the system.
        expect(fs.readFileSync.mock.calls.length).toBe(6);

        fs.readFileSync.mockClear();

        // Explicitly mock that no files have changed.
        mockChangedFiles = Object.create(null);

        // Watchman would give us different clocks.
        mockClocks = createMap({
          fruits: 'c:fake-clock:3',
          vegetables: 'c:fake-clock:4',
        });

        return new HasteMap(defaultConfig)
          .build()
          .then(({__hasteMapForTest: data}) => {
            expect(fs.readFileSync.mock.calls.length).toBe(1);
            if (require('v8').deserialize) {
              expect(fs.readFileSync).toBeCalledWith(cacheFilePath);
            } else {
              expect(fs.readFileSync).toBeCalledWith(cacheFilePath, 'utf8');
            }
            expect(normalizeMap(data.clocks)).toEqual(mockClocks);
            expect(normalizeMap(data.files)).toEqual(initialData.files);
            expect(normalizeMap(data.map)).toEqual(initialData.map);
          });
      }));

  it('only does minimal file system access when files change', () =>
    new HasteMap(defaultConfig)
      .build()
      .then(({__hasteMapForTest: initialData}) => {
        fs.readFileSync.mockClear();

        // Let's assume one JS file has changed.
        mockChangedFiles = object({
          '/project/fruits/banana.js': [
            '/**',
            ' * @providesModule Kiwi', // Identity crisis.
            ' */',
            'const Raspberry = require("Raspberry");',
          ].join('\n'),
        });

        // Watchman would give us different clocks for `/project/fruits`.
        mockClocks = createMap({
          fruits: 'c:fake-clock:3',
          vegetables: 'c:fake-clock:2',
        });

        return new HasteMap(defaultConfig)
          .build()
          .then(({__hasteMapForTest: data}) => {
            expect(fs.readFileSync.mock.calls.length).toBe(2);

            if (require('v8').serialize) {
              expect(fs.readFileSync).toBeCalledWith(cacheFilePath);
            } else {
              expect(fs.readFileSync).toBeCalledWith(cacheFilePath, 'utf8');
            }
            expect(fs.readFileSync).toBeCalledWith(
              '/project/fruits/banana.js',
              'utf8',
            );

            expect(normalizeMap(data.clocks)).toEqual(mockClocks);

            const files = new Map(initialData.files);
            files.set('fruits/banana.js', ['Kiwi', 32, 1, ['Raspberry'], null]);

            expect(normalizeMap(data.files)).toEqual(files);

            const map = new Map(initialData.map);

            map.set('Kiwi', map.get('Banana'));
            map.delete('Banana');
            expect(normalizeMap(data.map)).toEqual(map);
          });
      }));

  it('correctly handles file deletions', () =>
    new HasteMap(defaultConfig)
      .build()
      .then(({__hasteMapForTest: initialData}) => {
        fs.readFileSync.mockClear();

        // Let's assume one JS file was removed.
        delete mockFs['/project/fruits/banana.js'];
        mockChangedFiles = object({
          '/project/fruits/banana.js': null,
        });

        // Watchman would give us different clocks for `/project/fruits`.
        mockClocks = createMap({
          fruits: 'c:fake-clock:3',
          vegetables: 'c:fake-clock:2',
        });

        return new HasteMap(defaultConfig)
          .build()
          .then(({__hasteMapForTest: data}) => {
            const files = new Map(initialData.files);
            files.delete('fruits/banana.js');
            expect(normalizeMap(data.files)).toEqual(files);

            const map = new Map(initialData.map);
            map.delete('Banana');
            expect(normalizeMap(data.map)).toEqual(map);
          });
      }));

  it('correctly handles platform-specific file additions', async () => {
    mockFs = Object.create(null);
    mockFs['/project/fruits/strawberry.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Banana = require("Banana");',
    ].join('\n');
    let data;
    ({__hasteMapForTest: data} = await new HasteMap(defaultConfig).build());
    expect(data.map.get('Strawberry')).toEqual({
      g: ['fruits/strawberry.js', 0],
    });

    delete mockFs['/project/fruits/strawberry.ios.js'];
    mockChangedFiles = object({
      '/project/fruits/strawberry.ios.js': [
        '/**',
        ' * @providesModule Strawberry',
        ' */',
        'const Raspberry = require("Raspberry");',
      ].join('\n'),
    });
    mockClocks = createMap({fruits: 'c:fake-clock:3'});
    ({__hasteMapForTest: data} = await new HasteMap(defaultConfig).build());
    expect(data.map.get('Strawberry')).toEqual({
      g: ['fruits/strawberry.js', 0],
      ios: ['fruits/strawberry.ios.js', 0],
    });
  });

  it('correctly handles platform-specific file deletions', async () => {
    mockFs = Object.create(null);
    mockFs['/project/fruits/strawberry.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Banana = require("Banana");',
    ].join('\n');
    mockFs['/project/fruits/strawberry.ios.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Raspberry = require("Raspberry");',
    ].join('\n');
    let data;
    ({__hasteMapForTest: data} = await new HasteMap(defaultConfig).build());
    expect(data.map.get('Strawberry')).toEqual({
      g: ['fruits/strawberry.js', 0],
      ios: ['fruits/strawberry.ios.js', 0],
    });

    delete mockFs['/project/fruits/strawberry.ios.js'];
    mockChangedFiles = object({'/project/fruits/strawberry.ios.js': null});
    mockClocks = createMap({fruits: 'c:fake-clock:3'});
    ({__hasteMapForTest: data} = await new HasteMap(defaultConfig).build());
    expect(data.map.get('Strawberry')).toEqual({
      g: ['fruits/strawberry.js', 0],
    });
  });

  it('correctly handles platform-specific file renames', async () => {
    mockFs = Object.create(null);
    mockFs['/project/fruits/strawberry.ios.js'] = [
      '/**',
      ' * @providesModule Strawberry',
      ' */',
      'const Raspberry = require("Raspberry");',
    ].join('\n');
    let data;
    ({__hasteMapForTest: data} = await new HasteMap(defaultConfig).build());
    expect(data.map.get('Strawberry')).toEqual({
      ios: ['fruits/strawberry.ios.js', 0],
    });

    delete mockFs['/project/fruits/strawberry.ios.js'];
    mockChangedFiles = object({
      '/project/fruits/strawberry.ios.js': null,
      '/project/fruits/strawberry.js': [
        '/**',
        ' * @providesModule Strawberry',
        ' */',
        'const Banana = require("Banana");',
      ].join('\n'),
    });
    mockClocks = createMap({fruits: 'c:fake-clock:3'});
    ({__hasteMapForTest: data} = await new HasteMap(defaultConfig).build());
    expect(data.map.get('Strawberry')).toEqual({
      g: ['fruits/strawberry.js', 0],
    });
  });

  describe('duplicate modules', () => {
    beforeEach(async () => {
      mockFs['/project/fruits/another_strawberry.js'] = [
        '/**',
        ' * @providesModule Strawberry',
        ' */',
        'const Blackberry = require("Blackberry");',
      ].join('\n');

      const {__hasteMapForTest: data} = await new HasteMap(
        defaultConfig,
      ).build();
      expect(normalizeMap(data.duplicates)).toEqual(
        createMap({
          Strawberry: {
            g: {'fruits/another_strawberry.js': 0, 'fruits/strawberry.js': 0},
          },
        }),
      );
      expect(data.map.get('Strawberry')).toEqual({});
    });

    it('recovers when a duplicate file is deleted', async () => {
      delete mockFs['/project/fruits/another_strawberry.js'];
      mockChangedFiles = object({
        '/project/fruits/another_strawberry.js': null,
      });
      mockClocks = createMap({
        fruits: 'c:fake-clock:3',
        vegetables: 'c:fake-clock:2',
      });

      const {__hasteMapForTest: data} = await new HasteMap(
        defaultConfig,
      ).build();
      expect(normalizeMap(data.duplicates)).toEqual(new Map());
      expect(data.map.get('Strawberry')).toEqual({
        g: ['fruits/strawberry.js', 0],
      });
      // Make sure the other files are not affected.
      expect(data.map.get('Banana')).toEqual({g: ['fruits/banana.js', 0]});
    });

    it('recovers when a duplicate module is renamed', async () => {
      mockChangedFiles = object({
        '/project/fruits/another_strawberry.js': [
          '/**',
          ' * @providesModule AnotherStrawberry',
          ' */',
          'const Blackberry = require("Blackberry");',
        ].join('\n'),
      });
      mockClocks = createMap({
        fruits: 'c:fake-clock:3',
        vegetables: 'c:fake-clock:2',
      });

      const {__hasteMapForTest: data} = await new HasteMap(
        defaultConfig,
      ).build();
      expect(normalizeMap(data.duplicates)).toEqual(new Map());
      expect(data.map.get('Strawberry')).toEqual({
        g: ['fruits/strawberry.js', 0],
      });
      expect(data.map.get('AnotherStrawberry')).toEqual({
        g: ['fruits/another_strawberry.js', 0],
      });
      // Make sure the other files are not affected.
      expect(data.map.get('Banana')).toEqual({g: ['fruits/banana.js', 0]});
    });
  });

  it('discards the cache when configuration changes', () => {
    HasteMap.getCacheFilePath = getCacheFilePath;
    return new HasteMap(defaultConfig).build().then(() => {
      fs.readFileSync.mockClear();

      // Explicitly mock that no files have changed.
      mockChangedFiles = Object.create(null);

      // Watchman would give us different clocks.
      mockClocks = createMap({
        fruits: 'c:fake-clock:3',
        vegetables: 'c:fake-clock:4',
      });

      const config = Object.assign({}, defaultConfig, {
        ignorePattern: /kiwi|pear/,
      });
      return new HasteMap(config).build().then(({moduleMap}) => {
        expect(moduleMap.getModule('Pear')).toBe(null);
      });
    });
  });

  it('ignores files that do not exist', () => {
    const watchman = require('../crawlers/watchman');
    const mockImpl = watchman.getMockImplementation();
    // Wrap the watchman mock and add an invalid file to the file list.
    watchman.mockImplementation(options =>
      mockImpl(options).then(() => {
        const {data} = options;
        data.files.set('fruits/invalid/file.js', ['', 34, 0, []]);
        return data;
      }),
    );
    return new HasteMap(defaultConfig)
      .build()
      .then(({__hasteMapForTest: data}) => {
        expect(data.files.size).toBe(5);

        // Ensure this file is not part of the file list.
        expect(data.files.get('fruits/invalid/file.js')).toBe(undefined);
      });
  });

  it('distributes work across workers', () => {
    const jestWorker = require('jest-worker');
    return new HasteMap(
      Object.assign({}, defaultConfig, {
        maxWorkers: 4,
      }),
    )
      .build()
      .then(({__hasteMapForTest: data}) => {
        expect(jestWorker.mock.calls.length).toBe(1);

        expect(mockWorker.mock.calls.length).toBe(5);

        expect(mockWorker.mock.calls).toEqual([
          [
            {
              computeDependencies: true,
              computeSha1: false,
              filePath: '/project/fruits/__mocks__/Pear.js',
              hasteImplModulePath: undefined,
              rootDir: '/project',
            },
          ],
          [
            {
              computeDependencies: true,
              computeSha1: false,
              filePath: '/project/fruits/banana.js',
              hasteImplModulePath: undefined,
              rootDir: '/project',
            },
          ],
          [
            {
              computeDependencies: true,
              computeSha1: false,
              filePath: '/project/fruits/pear.js',
              hasteImplModulePath: undefined,
              rootDir: '/project',
            },
          ],
          [
            {
              computeDependencies: true,
              computeSha1: false,
              filePath: '/project/fruits/strawberry.js',
              hasteImplModulePath: undefined,
              rootDir: '/project',
            },
          ],
          [
            {
              computeDependencies: true,
              computeSha1: false,
              filePath: '/project/vegetables/melon.js',
              hasteImplModulePath: undefined,
              rootDir: '/project',
            },
          ],
        ]);

        expect(mockEnd).toBeCalled();
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
      data.files = createMap({
        'fruits/banana.js': ['', 32, 0, [], null],
      });
      return Promise.resolve(data);
    });

    return new HasteMap(defaultConfig)
      .build()
      .then(({__hasteMapForTest: data}) => {
        expect(watchman).toBeCalled();
        expect(node).toBeCalled();

        expect(data.files).toEqual(
          createMap({
            'fruits/banana.js': ['Banana', 32, 1, ['Strawberry'], null],
          }),
        );

        expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
      });
  });

  it('tries to crawl using node as a fallback when promise fails once', () => {
    const watchman = require('../crawlers/watchman');
    const node = require('../crawlers/node');

    watchman.mockImplementation(() =>
      Promise.reject(new Error('watchman error')),
    );
    node.mockImplementation(options => {
      const {data} = options;
      data.files = createMap({
        'fruits/banana.js': ['', 32, 0, [], null],
      });
      return Promise.resolve(data);
    });

    return new HasteMap(defaultConfig)
      .build()
      .then(({__hasteMapForTest: data}) => {
        expect(watchman).toBeCalled();
        expect(node).toBeCalled();

        expect(data.files).toEqual(
          createMap({
            'fruits/banana.js': ['Banana', 32, 1, ['Strawberry'], null],
          }),
        );
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

    return new HasteMap(defaultConfig).build().then(
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

  describe('file system changes processing', () => {
    function waitForItToChange(hasteMap) {
      return new Promise((resolve, reject) => {
        hasteMap.once('change', resolve);
      });
    }

    function mockDeleteFile(dirPath, filePath) {
      const e = mockEmitters[dirPath];
      e.emit('all', 'delete', filePath, dirPath, undefined);
    }

    function hm_it(title, fn, options) {
      options = options || {};
      (options.only ? it.only : it)(title, async () => {
        if (options.mockFs) {
          mockFs = options.mockFs;
        }
        const watchConfig = Object.assign({}, defaultConfig, {watch: true});
        const hm = new HasteMap(watchConfig);
        await hm.build();
        try {
          await fn(hm);
        } finally {
          hm.end();
        }
      });
    }

    hm_it('provides a new set of hasteHS and moduleMap', async hm => {
      const initialResult = await hm.build();
      const filePath = '/project/fruits/banana.js';
      expect(initialResult.hasteFS.getModuleName(filePath)).toBeDefined();
      expect(initialResult.moduleMap.getModule('Banana')).toBe(filePath);
      mockDeleteFile('/project/fruits', 'banana.js');
      mockDeleteFile('/project/fruits', 'banana.js');
      const {eventsQueue, hasteFS, moduleMap} = await waitForItToChange(hm);
      expect(eventsQueue).toHaveLength(1);
      const deletedBanana = {filePath, stat: undefined, type: 'delete'};
      expect(eventsQueue).toEqual([deletedBanana]);
      // Verify we didn't change the original map.
      expect(initialResult.hasteFS.getModuleName(filePath)).toBeDefined();
      expect(initialResult.moduleMap.getModule('Banana')).toBe(filePath);
      expect(hasteFS.getModuleName(filePath)).toBeNull();
      expect(moduleMap.getModule('Banana')).toBeNull();
    });

    const MOCK_STAT_FILE = {
      isDirectory: () => false,
      mtime: {getTime: () => 45},
    };

    const MOCK_STAT_FOLDER = {
      isDirectory: () => true,
      mtime: {getTime: () => 45},
    };

    hm_it('handles several change events at once', async hm => {
      mockFs['/project/fruits/tomato.js'] = [
        '/**',
        ' * @providesModule Tomato',
        ' */',
      ].join('\n');
      mockFs['/project/fruits/pear.js'] = [
        '/**',
        ' * @providesModule Kiwi',
        ' */',
      ].join('\n');
      const e = mockEmitters['/project/fruits'];
      e.emit('all', 'add', 'tomato.js', '/project/fruits', MOCK_STAT_FILE);
      e.emit('all', 'change', 'pear.js', '/project/fruits', MOCK_STAT_FILE);
      const {eventsQueue, hasteFS, moduleMap} = await waitForItToChange(hm);
      expect(eventsQueue).toEqual([
        {
          filePath: '/project/fruits/tomato.js',
          stat: MOCK_STAT_FILE,
          type: 'add',
        },
        {
          filePath: '/project/fruits/pear.js',
          stat: MOCK_STAT_FILE,
          type: 'change',
        },
      ]);
      expect(hasteFS.getModuleName('/project/fruits/tomato.js')).not.toBeNull();
      expect(moduleMap.getModule('Tomato')).toBeDefined();
      expect(moduleMap.getModule('Pear')).toBeNull();
      expect(moduleMap.getModule('Kiwi')).toBe('/project/fruits/pear.js');
    });

    hm_it('does not emit duplicate change events', async hm => {
      const e = mockEmitters['/project/fruits'];
      e.emit('all', 'change', 'tomato.js', '/project/fruits', MOCK_STAT_FILE);
      e.emit('all', 'change', 'tomato.js', '/project/fruits', MOCK_STAT_FILE);
      const {eventsQueue} = await waitForItToChange(hm);
      expect(eventsQueue).toHaveLength(1);
    });

    hm_it(
      'emits a change even if a file in node_modules has changed',
      async hm => {
        const e = mockEmitters['/project/fruits'];
        e.emit(
          'all',
          'add',
          'apple.js',
          '/project/fruits/node_modules/',
          MOCK_STAT_FILE,
        );
        const {eventsQueue, hasteFS} = await waitForItToChange(hm);
        const filePath = '/project/fruits/node_modules/apple.js';
        expect(eventsQueue).toHaveLength(1);
        expect(eventsQueue).toEqual([
          {filePath, stat: MOCK_STAT_FILE, type: 'add'},
        ]);
        expect(hasteFS.getModuleName(filePath)).toBeDefined();
      },
    );

    hm_it(
      'correctly tracks changes to both platform-specific versions of a single module name',
      async hm => {
        const {moduleMap: initMM} = await hm.build();
        expect(initMM.getModule('Orange', 'ios')).toBeTruthy();
        expect(initMM.getModule('Orange', 'android')).toBeTruthy();
        const e = mockEmitters['/project/fruits'];
        e.emit(
          'all',
          'change',
          'Orange.ios.js',
          '/project/fruits/',
          MOCK_STAT_FILE,
        );
        e.emit(
          'all',
          'change',
          'Orange.android.js',
          '/project/fruits/',
          MOCK_STAT_FILE,
        );
        const {eventsQueue, hasteFS, moduleMap} = await waitForItToChange(hm);
        expect(eventsQueue).toHaveLength(2);
        expect(eventsQueue).toEqual([
          {
            filePath: '/project/fruits/Orange.ios.js',
            stat: MOCK_STAT_FILE,
            type: 'change',
          },
          {
            filePath: '/project/fruits/Orange.android.js',
            stat: MOCK_STAT_FILE,
            type: 'change',
          },
        ]);
        expect(
          hasteFS.getModuleName('/project/fruits/Orange.ios.js'),
        ).toBeTruthy();
        expect(
          hasteFS.getModuleName('/project/fruits/Orange.android.js'),
        ).toBeTruthy();
        const iosVariant = moduleMap.getModule('Orange', 'ios');
        expect(iosVariant).toBe('/project/fruits/Orange.ios.js');
        const androidVariant = moduleMap.getModule('Orange', 'android');
        expect(androidVariant).toBe('/project/fruits/Orange.android.js');
      },
      {
        mockFs: {
          '/project/fruits/Orange.android.js': [
            '/**',
            ' * @providesModule Orange',
            ' */',
          ].join('\n'),

          '/project/fruits/Orange.ios.js': [
            '/**',
            ' * @providesModule Orange',
            ' */',
          ].join('\n'),
        },
      },
    );

    describe('recovery from duplicate module IDs', () => {
      async function setupDuplicates(hm) {
        mockFs['/project/fruits/pear.js'] = [
          '/**',
          ' * @providesModule Pear',
          ' */',
        ].join('\n');
        mockFs['/project/fruits/blueberry.js'] = [
          '/**',
          ' * @providesModule Pear',
          ' */',
        ].join('\n');
        const e = mockEmitters['/project/fruits'];
        e.emit('all', 'change', 'pear.js', '/project/fruits', MOCK_STAT_FILE);
        e.emit('all', 'add', 'blueberry.js', '/project/fruits', MOCK_STAT_FILE);
        const {hasteFS, moduleMap} = await waitForItToChange(hm);
        expect(hasteFS.exists('/project/fruits/blueberry.js')).toBe(true);
        try {
          moduleMap.getModule('Pear');
          throw new Error('should be unreachable');
        } catch (error) {
          const {
            DuplicateHasteCandidatesError,
          } = require('../module_map').default;
          expect(error).toBeInstanceOf(DuplicateHasteCandidatesError);
          expect(error.hasteName).toBe('Pear');
          expect(error.platform).toBe('g');
          expect(error.supportsNativePlatform).toBe(false);
          expect(error.duplicatesSet).toEqual({
            '/project/fruits/blueberry.js': 0,
            '/project/fruits/pear.js': 0,
          });
          expect(error.message).toMatchSnapshot();
        }
      }

      hm_it(
        'recovers when the oldest version of the duplicates is fixed',
        async hm => {
          await setupDuplicates(hm);
          mockFs['/project/fruits/pear.js'] = [
            '/**',
            ' * @providesModule OldPear',
            ' */',
          ].join('\n');
          const e = mockEmitters['/project/fruits'];
          e.emit('all', 'change', 'pear.js', '/project/fruits', MOCK_STAT_FILE);
          const {moduleMap} = await waitForItToChange(hm);
          expect(moduleMap.getModule('Pear')).toBe(
            '/project/fruits/blueberry.js',
          );
          expect(moduleMap.getModule('OldPear')).toBe(
            '/project/fruits/pear.js',
          );
          expect(moduleMap.getModule('Blueberry')).toBe(null);
        },
      );

      hm_it('recovers when the most recent duplicate is fixed', async hm => {
        await setupDuplicates(hm);
        mockFs['/project/fruits/blueberry.js'] = [
          '/**',
          ' * @providesModule Blueberry',
          ' */',
        ].join('\n');
        const e = mockEmitters['/project/fruits'];
        e.emit(
          'all',
          'change',
          'blueberry.js',
          '/project/fruits',
          MOCK_STAT_FILE,
        );
        const {moduleMap} = await waitForItToChange(hm);
        expect(moduleMap.getModule('Pear')).toBe('/project/fruits/pear.js');
        expect(moduleMap.getModule('Blueberry')).toBe(
          '/project/fruits/blueberry.js',
        );
      });

      hm_it('ignore directories', async hm => {
        const e = mockEmitters['/project/fruits'];
        e.emit(
          'all',
          'change',
          'tomato.js',
          '/project/fruits',
          MOCK_STAT_FOLDER,
        );
        e.emit(
          'all',
          'change',
          'tomato.js',
          '/project/fruits/tomato.js/index.js',
          MOCK_STAT_FILE,
        );
        const {eventsQueue} = await waitForItToChange(hm);
        expect(eventsQueue).toHaveLength(1);
      });
    });
  });
});
