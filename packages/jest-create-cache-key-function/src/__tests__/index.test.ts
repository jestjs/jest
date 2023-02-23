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
