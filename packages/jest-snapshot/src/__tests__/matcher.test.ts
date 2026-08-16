/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type Context, toMatchSnapshot} from '../';

test('returns matcher name, expected and actual values', () => {
  const testRetryOwner = {};
  const match = jest.fn((_options: unknown) => ({actual: 'a', expected: 'b'}));
  const mockedContext = {
    currentTestRetryOwner: () => testRetryOwner,
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
    }),
  );
  expect(match).toHaveBeenCalledWith(expect.objectContaining({testRetryOwner}));
});

test('passes the retry owner to failed property snapshots', () => {
  const testRetryOwner = {};
  const fail = jest.fn(
    (
      _testName: string,
      _received: unknown,
      _key?: string,
      _testRetryOwner?: object,
    ) => 'test name 1',
  );
  const mockedContext = {
    currentTestName: 'test name',
    currentTestRetryOwner: () => testRetryOwner,
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
    testRetryOwner,
  );
});
