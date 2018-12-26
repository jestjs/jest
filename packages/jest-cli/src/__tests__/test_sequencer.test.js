/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

import TestSequencer from '../TestSequencer';

jest.mock('fs');

const fs = require('fs');
const path = require('path');
const mockResolveRecursive = jest.fn(
  (path, options) =>
    ({
      '/test-a.js': ['/sut-a.js', '/test-util.js'],
      '/test-ab.js': ['/sut-ab.js'],
      '/test-b.js': ['/sut-b0.js'],
      '/test-cp.js': ['child_process'],
      '/test-e.js': ['/sut-e.js'],
      '/test-fs.js': ['fs'],
      '/test-http.js': ['http'],
    }[path] || []),
);
afterEach(() => {
  mockResolveRecursive.mockClear();
});
jest.mock(
  'jest-resolve-dependencies',
  () =>
    class {
      constructor() {
        this.resolveRecursive = mockResolveRecursive;
      }
    },
);

const FAIL = 0;
const SUCCESS = 1;

let sequencer;

const resolver = {
  isCoreModule: path => !path.startsWith('/'),
};

const context = {
  config: {
    cache: true,
    cacheDirectory: '/cache',
    name: 'test',
  },
  hasteFS: {
    getSize: path => path.length,
  },
  resolver,
};

const secondContext = {
  config: {
    cache: true,
    cacheDirectory: '/cache2',
    name: 'test2',
  },
  hasteFS: {
    getSize: path => path.length,
  },
  resolver,
};

const toTests = paths =>
  paths.map(path => ({
    context,
    duration: undefined,
    path,
  }));

beforeEach(() => {
  sequencer = new TestSequencer();

  fs.readFileSync = jest.fn(() => '{}');
  fs.existsSync = () => true;
  fs.writeFileSync = jest.fn();
});

test('sorts by dependency file sizes if there is no timing information', () => {
  expect(sequencer.sort(toTests(['/test-ab.js', '/test-a.js']))).toEqual([
    {context, duration: undefined, path: '/test-a.js'},
    {context, duration: undefined, path: '/test-ab.js'},
  ]);
  expect(mockResolveRecursive).toHaveBeenCalledWith(expect.any(String), {
    includeCoreModules: true,
  });
});

test('includes the test file itself during size calculation', () => {
  expect(sequencer.sort(toTests(['/test-b.js', '/test-ab.js']))).toEqual([
    {context, duration: undefined, path: '/test-ab.js'},
    {context, duration: undefined, path: '/test-b.js'},
  ]);
  expect(mockResolveRecursive).toHaveBeenCalledWith(expect.any(String), {
    includeCoreModules: true,
  });
});

test('prioritizes tests that depend on certain core modules', () => {
  expect(
    sequencer.sort(
      toTests(['/test-a.js', '/test-cp.js', '/test-fs.js', '/test-http.js']),
    ),
  ).toEqual([
    {context, duration: undefined, path: '/test-cp.js'},
    {context, duration: undefined, path: '/test-fs.js'},
    {context, duration: undefined, path: '/test-http.js'},
    {context, duration: undefined, path: '/test-a.js'},
  ]);
  expect(mockResolveRecursive).toHaveBeenCalledWith(expect.any(String), {
    includeCoreModules: true,
  });
});

test('sorts based on timing information', () => {
  fs.readFileSync = jest.fn(() =>
    JSON.stringify({
      '/test-a.js': [SUCCESS, 5],
      '/test-ab.js': [SUCCESS, 3],
    }),
  );
  expect(sequencer.sort(toTests(['/test-a.js', '/test-ab.js']))).toEqual([
    {context, duration: 5, path: '/test-a.js'},
    {context, duration: 3, path: '/test-ab.js'},
  ]);
});

test('sorts based on failures and timing information', () => {
  fs.readFileSync = jest.fn(() =>
    JSON.stringify({
      '/test-a.js': [SUCCESS, 5],
      '/test-ab.js': [FAIL, 0],
      '/test-c.js': [FAIL, 6],
      '/test-d.js': [SUCCESS, 2],
    }),
  );
  expect(
    sequencer.sort(
      toTests(['/test-a.js', '/test-ab.js', '/test-c.js', '/test-d.js']),
    ),
  ).toEqual([
    {context, duration: 6, path: '/test-c.js'},
    {context, duration: 0, path: '/test-ab.js'},
    {context, duration: 5, path: '/test-a.js'},
    {context, duration: 2, path: '/test-d.js'},
  ]);
});

test('sorts based on failures, timing information and dependency file sizes', () => {
  fs.readFileSync = jest.fn(() =>
    JSON.stringify({
      '/test-a.js': [SUCCESS, 5],
      '/test-ab.js': [FAIL, 1],
      '/test-cd.js': [FAIL],
      '/test-d.js': [SUCCESS, 2],
      '/test-e.js': [FAIL],
    }),
  );
  expect(
    sequencer.sort(
      toTests([
        '/test-a.js',
        '/test-ab.js',
        '/test-cd.js',
        '/test-d.js',
        '/test-e.js',
      ]),
    ),
  ).toEqual([
    {context, duration: undefined, path: '/test-e.js'},
    {context, duration: undefined, path: '/test-cd.js'},
    {context, duration: 1, path: '/test-ab.js'},
    {context, duration: 5, path: '/test-a.js'},
    {context, duration: 2, path: '/test-d.js'},
  ]);
});

test('writes the cache based on results without existing cache', () => {
  fs.readFileSync = jest.fn(() => {
    throw new Error('File does not exist.');
  });

  const testPaths = ['/test-a.js', '/test-b.js', '/test-c.js'];
  const tests = sequencer.sort(toTests(testPaths));
  sequencer.cacheResults(tests, {
    testResults: [
      {
        numFailingTests: 0,
        perfStats: {end: 2, start: 1},
        testFilePath: '/test-a.js',
      },
      {
        numFailingTests: 0,
        perfStats: {end: 0, start: 0},
        skipped: true,
        testFilePath: '/test-b.js',
      },
      {
        numFailingTests: 1,
        perfStats: {end: 4, start: 1},
        testFilePath: '/test-c.js',
      },
      {
        numFailingTests: 1,
        perfStats: {end: 2, start: 1},
        testFilePath: '/test-x.js',
      },
    ],
  });
  const fileData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(fileData).toEqual({
    '/test-a.js': [SUCCESS, 1],
    '/test-c.js': [FAIL, 3],
  });
});

test('writes the cache based on the results', () => {
  fs.readFileSync = jest.fn(() =>
    JSON.stringify({
      '/test-a.js': [SUCCESS, 5],
      '/test-b.js': [FAIL, 1],
      '/test-c.js': [FAIL],
    }),
  );

  const testPaths = ['/test-a.js', '/test-b.js', '/test-c.js'];
  const tests = sequencer.sort(toTests(testPaths));
  sequencer.cacheResults(tests, {
    testResults: [
      {
        numFailingTests: 0,
        perfStats: {end: 2, start: 1},
        testFilePath: '/test-a.js',
      },
      {
        numFailingTests: 0,
        perfStats: {end: 0, start: 0},
        skipped: true,
        testFilePath: '/test-b.js',
      },
      {
        numFailingTests: 1,
        perfStats: {end: 4, start: 1},
        testFilePath: '/test-c.js',
      },
      {
        numFailingTests: 1,
        perfStats: {end: 2, start: 1},
        testFilePath: '/test-x.js',
      },
    ],
  });
  const fileData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(fileData).toEqual({
    '/test-a.js': [SUCCESS, 1],
    '/test-b.js': [FAIL, 1],
    '/test-c.js': [FAIL, 3],
  });
});

test('works with multiple contexts', () => {
  fs.readFileSync = jest.fn(cacheName =>
    cacheName.startsWith(path.sep + 'cache' + path.sep)
      ? JSON.stringify({
          '/test-a.js': [SUCCESS, 5],
          '/test-b.js': [FAIL, 1],
        })
      : JSON.stringify({
          '/test-c.js': [FAIL],
        }),
  );

  const testPaths = [
    {context, duration: null, path: '/test-a.js'},
    {context, duration: null, path: '/test-b.js'},
    {context: secondContext, duration: null, path: '/test-c.js'},
  ];
  const tests = sequencer.sort(testPaths);
  sequencer.cacheResults(tests, {
    testResults: [
      {
        numFailingTests: 0,
        perfStats: {end: 2, start: 1},
        testFilePath: '/test-a.js',
      },
      {
        numFailingTests: 0,
        perfStats: {end: 0, start: 0},
        skipped: true,
        testFilePath: '/test-b.js',
      },
      {
        numFailingTests: 0,
        perfStats: {end: 4, start: 1},
        testFilePath: '/test-c.js',
      },
      {
        numFailingTests: 1,
        perfStats: {end: 2, start: 1},
        testFilePath: '/test-x.js',
      },
    ],
  });
  const fileDataA = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(fileDataA).toEqual({
    '/test-a.js': [SUCCESS, 1],
    '/test-b.js': [FAIL, 1],
  });
  const fileDataB = JSON.parse(fs.writeFileSync.mock.calls[1][1]);
  expect(fileDataB).toEqual({
    '/test-c.js': [SUCCESS, 3],
  });
});
