/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type Context, toMatchSnapshot} from '../';

test('returns matcher name, expected, actual and snapshot path values', () => {
  const testIdentity = {};
  const match = jest.fn((_options: unknown) => ({
    actual: 'a',
    expected: 'b',
    snapshotPath: '/path/to/test.snap',
  }));
  const mockedContext = {
    currentTestIdentity: () => testIdentity,
    snapshotState: {
      match,
    },
  } as unknown as Context;

  const matcherResult = toMatchSnapshot.call(mockedContext, {
    a: 1,
  });

  expect(matcherResult).toEqual(
    expect.objectContaining({
      actual: 'a',
      expected: 'b',
      name: 'toMatchSnapshot',
      snapshotPath: '/path/to/test.snap',
    }),
  );
  expect(match).toHaveBeenCalledWith(expect.objectContaining({testIdentity}));
});

test('passes the test identity to failed property snapshots', () => {
  const testIdentity = {};
  const fail = jest.fn(
    (
      _testName: string,
      _received: unknown,
      _key?: string,
      _testIdentity?: object,
    ) => 'test name 1',
  );
  const mockedContext = {
    currentTestIdentity: () => testIdentity,
    currentTestName: 'test name',
    equals: () => false,
    snapshotState: {expand: false, fail},
    utils: {iterableEquality: jest.fn(), subsetEquality: jest.fn()},
  } as unknown as Context;
  const received = {value: 1};

  toMatchSnapshot.call(mockedContext, received, {value: 2});

  expect(fail).toHaveBeenCalledWith(
    'test name',
    received,
    undefined,
    testIdentity,
  );
});
