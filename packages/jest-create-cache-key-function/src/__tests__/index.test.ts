/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {interopRequireDefault} from 'jest-util';

let NODE_ENV: string;
let BABEL_ENV: string;

beforeEach(() => {
  NODE_ENV = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  BABEL_ENV = process.env.BABEL_ENV;
  process.env.BABEL_ENV = 'test';
  Object.defineProperty(process, 'platform', {
    value: 'linux',
  });
});

afterEach(() => {
  process.env.NODE_ENV = NODE_ENV;
  process.env.BABEL_ENV = BABEL_ENV;
});

test('creation of a cache key', () => {
  const createCacheKeyFunction = interopRequireDefault(
    require('../index'),
  ).default;
  const createCacheKey = createCacheKeyFunction([], ['value']);
  const hashA = createCacheKey('test', 'test.js', null, {
    config: {},
    instrument: false,
  });
  const hashB = createCacheKey('test code;', 'test.js', null, {
    config: {},
    instrument: false,
  });
  const hashC = createCacheKey('test', 'test.js', null, {
    config: {},
    instrument: true,
  });

  expect(hashA).toHaveLength(32);
  expect(hashA).not.toEqual(hashB);
  expect(hashA).not.toEqual(hashC);
});

test('a caller support flag changes the key', () => {
  const createCacheKeyFunction = interopRequireDefault(
    require('../index'),
  ).default;
  const createCacheKey = createCacheKeyFunction([], ['value']);
  const asCjs = createCacheKey('test', 'test.js', {
    config: {},
    instrument: false,
    supportsStaticESM: false,
  });
  const asEsm = createCacheKey('test', 'test.js', {
    config: {},
    instrument: false,
    supportsStaticESM: true,
  });

  expect(asCjs).not.toEqual(asEsm);
});

// Jest before 27 did not pass them, and behaved as all-false.
test('a missing caller support flag hashes as false', () => {
  const createCacheKeyFunction = interopRequireDefault(
    require('../index'),
  ).default;
  const createCacheKey = createCacheKeyFunction([], ['value']);
  const absent = createCacheKey('test', 'test.js', {
    config: {},
    instrument: false,
  });
  const explicitlyFalse = createCacheKey('test', 'test.js', {
    config: {},
    instrument: false,
    supportsDynamicImport: false,
    supportsExportNamespaceFrom: false,
    supportsStaticESM: false,
    supportsTopLevelAwait: false,
  });

  expect(absent).toEqual(explicitlyFalse);
});

test('the project config changes the key', () => {
  const createCacheKeyFunction = interopRequireDefault(
    require('../index'),
  ).default;
  const createCacheKey = createCacheKeyFunction([], ['value']);
  const before = createCacheKey('test', 'test.js', {
    config: {},
    configString: JSON.stringify({transform: [['x', 't', {target: 'es5'}]]}),
    instrument: false,
  });
  const after = createCacheKey('test', 'test.js', {
    config: {},
    configString: JSON.stringify({transform: [['x', 't', {target: 'es2020'}]]}),
    instrument: false,
  });

  expect(before).not.toEqual(after);
});

// The pre-27 signature passes it as its own argument rather than in the bag.
test('the project config changes the key on the old signature', () => {
  const createCacheKeyFunction = interopRequireDefault(
    require('../index'),
  ).default;
  const createCacheKey = createCacheKeyFunction([], ['value']);
  const before = createCacheKey('test', 'test.js', 'config-a', {
    config: {},
    instrument: false,
  });
  const after = createCacheKey('test', 'test.js', 'config-b', {
    config: {},
    instrument: false,
  });

  expect(before).not.toEqual(after);
});

test('creation of a cache key on win32', () => {
  Object.defineProperty(process, 'platform', {
    value: 'win32',
  });
  const createCacheKeyFunction = interopRequireDefault(
    require('../index'),
  ).default;
  const createCacheKey = createCacheKeyFunction([], ['value']);
  const hashA = createCacheKey('test', 'test.js', null, {
    config: {},
    instrument: false,
  });

  expect(hashA).toHaveLength(16);
});
