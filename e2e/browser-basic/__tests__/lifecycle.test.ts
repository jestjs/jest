/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';

const order: Array<string> = [];

beforeAll(() => {
  order.push('root beforeAll');
});

afterAll(() => {
  order.push('root afterAll');
});

beforeEach(() => {
  order.push('root beforeEach');
});

afterEach(() => {
  order.push('root afterEach');
});

describe('lifecycle hooks', () => {
  beforeAll(() => {
    order.push('describe beforeAll');
  });

  afterAll(() => {
    order.push('describe afterAll');
  });

  beforeEach(() => {
    order.push('describe beforeEach');
  });

  afterEach(() => {
    order.push('describe afterEach');
  });

  it('first test', () => {
    order.push('first test');
    expect(order).toEqual([
      'root beforeAll',
      'describe beforeAll',
      'root beforeEach',
      'describe beforeEach',
      'first test',
    ]);
  });

  it('second test', () => {
    order.push('second test');
    expect(order).toEqual([
      'root beforeAll',
      'describe beforeAll',
      'root beforeEach',
      'describe beforeEach',
      'first test',
      'describe afterEach',
      'root afterEach',
      'root beforeEach',
      'describe beforeEach',
      'second test',
    ]);
  });
});
