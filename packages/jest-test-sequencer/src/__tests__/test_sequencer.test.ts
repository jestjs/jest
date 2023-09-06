/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as mockedFs from 'graceful-fs';
import type {AggregatedResult, Test, TestContext} from '@jest/test-result';
import {makeProjectConfig} from '@jest/test-utils';
import TestSequencer from '../index';

jest.mock('graceful-fs', () => ({
  ...jest.createMockFromModule<typeof import('fs')>('fs'),
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => '{}'),
}));
const FAIL = 0;
const SUCCESS = 1;

let sequencer: TestSequencer;

const fs = jest.mocked(mockedFs);

const context: TestContext = {
  config: makeProjectConfig({
    cache: true,
    cacheDirectory: '/cache',
    haste: {},
    id: 'test',
  }),
  hasteFS: {
    getSize: path => path.length,
  },
};

const secondContext: TestContext = {
  config: makeProjectConfig({
    cache: true,
    cacheDirectory: '/cache2',
    haste: {},
    id: 'test2',
  }),
  hasteFS: {
    getSize: path => path.length,
  },
};

const toTests = (paths: Array<string>) =>
  paths.map<Test>(path => ({
    context,
    duration: undefined,
    path,
  }));

beforeEach(() => {
  jest.clearAllMocks();
  sequencer = new TestSequencer();
});

test('sorts by file size if there is no timing information', () => {
  expect(sequencer.sort(toTests(['/test-a.js', '/test-ab.js']))).toEqual([
    {context, duration: undefined, path: '/test-ab.js'},
    {context, duration: undefined, path: '/test-a.js'},
  ]);
});

test('sorts based on timing information', () => {
  fs.readFileSync.mockImplementationOnce(() =>
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
  fs.readFileSync.mockImplementationOnce(() =>
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

test('sorts based on failures, timing information and file size', () => {
  fs.readFileSync.mockImplementationOnce(() =>
    JSON.stringify({
      '/test-a.js': [SUCCESS, 5],
      '/test-ab.js': [FAIL, 1],
      '/test-c.js': [FAIL],
      '/test-d.js': [SUCCESS, 2],
      '/test-efg.js': [FAIL],
    }),
  );
  expect(
    sequencer.sort(
      toTests([
        '/test-a.js',
        '/test-ab.js',
        '/test-c.js',
        '/test-d.js',
        '/test-efg.js',
      ]),
    ),
  ).toEqual([
    {context, duration: undefined, path: '/test-efg.js'},
    {context, duration: undefined, path: '/test-c.js'},
    {context, duration: 1, path: '/test-ab.js'},
    {context, duration: 5, path: '/test-a.js'},
    {context, duration: 2, path: '/test-d.js'},
  ]);
});

test('writes the cache based on results without existing cache', async () => {
  fs.readFileSync.mockImplementationOnce(() => {
    throw new Error('File does not exist.');
  });

  const testPaths = ['/test-a.js', '/test-b.js', '/test-c.js'];
  const tests = await sequencer.sort(toTests(testPaths));
  sequencer.cacheResults(tests, {
    testResults: [
      {
        numFailingTests: 0,
        perfStats: {end: 2, runtime: 1, start: 1},
        testFilePath: '/test-a.js',
      },
      {
        numFailingTests: 0,
        perfStats: {end: 0, runtime: 0, start: 0},
        skipped: true,
        testFilePath: '/test-b.js',
      },
      {
        numFailingTests: 1,
        // this is missing `runtime` to test that it is calculated
        perfStats: {end: 4, start: 1},
        testFilePath: '/test-c.js',
      },
      {
        numFailingTests: 1,
        perfStats: {end: 2, runtime: 1, start: 1},
        testFilePath: '/test-x.js',
      },
    ],
  });
  const fileData = JSON.parse(
    fs.writeFileSync.mock.calls[0][1],
  ) as AggregatedResult;
  expect(fileData).toEqual({
    '/test-a.js': [SUCCESS, 1],
    '/test-c.js': [FAIL, 3],
  });
});

test('returns failed tests in sorted order', () => {
  fs.readFileSync.mockImplementationOnce(() =>
    JSON.stringify({
      '/test-a.js': [SUCCESS, 5],
      '/test-ab.js': [FAIL, 1],
      '/test-c.js': [FAIL],
    }),
  );
  const testPaths = ['/test-a.js', '/test-ab.js', '/test-c.js'];
  expect(sequencer.allFailedTests(toTests(testPaths))).toEqual([
    {context, duration: undefined, path: '/test-c.js'},
    {context, duration: 1, path: '/test-ab.js'},
  ]);
});

test('writes the cache based on the results', async () => {
  fs.readFileSync.mockImplementationOnce(() =>
    JSON.stringify({
      '/test-a.js': [SUCCESS, 5],
      '/test-b.js': [FAIL, 1],
      '/test-c.js': [FAIL],
    }),
  );

  const testPaths = ['/test-a.js', '/test-b.js', '/test-c.js'];
  const tests = await sequencer.sort(toTests(testPaths));
  sequencer.cacheResults(tests, {
    testResults: [
      {
        numFailingTests: 0,
        perfStats: {end: 2, runtime: 1, start: 1},
        testFilePath: '/test-a.js',
      },
      {
        numFailingTests: 0,
        perfStats: {end: 0, runtime: 0, start: 0},
        skipped: true,
        testFilePath: '/test-b.js',
      },
      {
        numFailingTests: 1,
        perfStats: {end: 4, runtime: 3, start: 1},
        testFilePath: '/test-c.js',
      },
      {
        numFailingTests: 1,
        perfStats: {end: 2, runtime: 1, start: 1},
        testFilePath: '/test-x.js',
      },
    ],
  });
  const fileData = JSON.parse(
    fs.writeFileSync.mock.calls[0][1],
  ) as AggregatedResult;
  expect(fileData).toEqual({
    '/test-a.js': [SUCCESS, 1],
    '/test-b.js': [FAIL, 1],
    '/test-c.js': [FAIL, 3],
  });
});

test('works with multiple contexts', async () => {
  fs.readFileSync.mockImplementationOnce(cacheName => {
    if (typeof cacheName !== 'string') {
      throw new Error('Must be called with a string');
    }

    return cacheName.startsWith(`${path.sep}cache${path.sep}`)
      ? JSON.stringify({
          '/test-a.js': [SUCCESS, 5],
          '/test-b.js': [FAIL, 1],
        })
      : JSON.stringify({
          '/test-c.js': [FAIL],
        });
  });

  const testPaths = [
    {context, duration: null, path: '/test-a.js'},
    {context, duration: null, path: '/test-b.js'},
    {context: secondContext, duration: null, path: '/test-c.js'},
  ];
  const tests = await sequencer.sort(testPaths);
  sequencer.cacheResults(tests, {
    testResults: [
      {
        numFailingTests: 0,
        perfStats: {end: 2, runtime: 1, start: 1},
        testFilePath: '/test-a.js',
      },
      {
        numFailingTests: 0,
        perfStats: {end: 0, runtime: 1, start: 0},
        skipped: true,
        testFilePath: '/test-b.js',
      },
      {
        numFailingTests: 0,
        perfStats: {end: 4, runtime: 3, start: 1},
        testFilePath: '/test-c.js',
      },
      {
        numFailingTests: 1,
        perfStats: {end: 2, runtime: 1, start: 1},
        testFilePath: '/test-x.js',
      },
    ],
  });
  const fileDataA = JSON.parse(
    fs.writeFileSync.mock.calls[0][1],
  ) as AggregatedResult;
  expect(fileDataA).toEqual({
    '/test-a.js': [SUCCESS, 1],
    '/test-b.js': [FAIL, 1],
  });
  const fileDataB = JSON.parse(
    fs.writeFileSync.mock.calls[1][1],
  ) as AggregatedResult;
  expect(fileDataB).toEqual({
    '/test-c.js': [SUCCESS, 3],
  });
});

test('does not shard by default', async () => {
  const tests = await sequencer.shard(toTests(['/test-a.js', '/test-ab.js']), {
    shardCount: 1,
    shardIndex: 1,
  });

  expect(tests.map(test => test.path)).toEqual(['/test-ab.js', '/test-a.js']);
});

test('return first shard', async () => {
  const tests = await sequencer.shard(
    toTests(['/test-a.js', '/test-abc.js', '/test-ab.js']),
    {
      shardCount: 3,
      shardIndex: 1,
    },
  );

  expect(tests.map(test => test.path)).toEqual(['/test-ab.js']);
});

test('return second shard', async () => {
  const tests = await sequencer.shard(
    toTests(['/test-a.js', '/test-abc.js', '/test-ab.js']),
    {
      shardCount: 3,
      shardIndex: 2,
    },
  );

  expect(tests.map(test => test.path)).toEqual(['/test-abc.js']);
});

test('return third shard', async () => {
  const tests = await sequencer.shard(
    toTests(['/test-abc.js', '/test-a.js', '/test-ab.js']),
    {
      shardCount: 3,
      shardIndex: 3,
    },
  );

  expect(tests.map(test => test.path)).toEqual(['/test-a.js']);
});

test('returns expected 100/10 shards', async () => {
  const allTests = toTests(new Array(100).fill(true).map((_, i) => `/${i}.js`));

  const shards = await Promise.all(
    new Array(10).fill(true).map((_, i) =>
      sequencer.shard(allTests, {
        shardCount: 10,
        shardIndex: i + 1,
      }),
    ),
  );

  expect(shards.map(shard => shard.length)).toEqual([
    10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
  ]);
});

test('returns expected 100/8 shards', async () => {
  const allTests = toTests(new Array(100).fill(true).map((_, i) => `/${i}.js`));

  const shards = await Promise.all(
    new Array(8).fill(true).map((_, i) =>
      sequencer.shard(allTests, {
        shardCount: 8,
        shardIndex: i + 1,
      }),
    ),
  );

  expect(shards.map(shard => shard.length)).toEqual([
    13, 13, 13, 13, 12, 12, 12, 12,
  ]);
});

test('returns expected 55/12 shards', async () => {
  const allTests = toTests(new Array(55).fill(true).map((_, i) => `/${i}.js`));

  const shards = await Promise.all(
    new Array(12).fill(true).map((_, i) =>
      sequencer.shard(allTests, {
        shardCount: 12,
        shardIndex: i + 1,
      }),
    ),
  );

  expect(shards.map(shard => shard.length)).toEqual([
    5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4,
  ]);
});
