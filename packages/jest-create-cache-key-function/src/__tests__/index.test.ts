/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
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

  expect(hashA.length).toEqual(32);
  expect(hashA).not.toEqual(hashB);
  expect(hashA).not.toEqual(hashC);
});
