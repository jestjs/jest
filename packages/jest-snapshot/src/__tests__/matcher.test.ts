/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type Context, toMatchInlineSnapshot, toMatchSnapshot} from '../';

test('returns matcher name, expected, actual and snapshot path values', () => {
  const testIdentity = {};
  const match = jest.fn((_options: unknown) => ({
    actual: 'a',
    expected: 'b',
  }));
  const mockedContext = {
    currentTestIdentity: () => testIdentity,
    snapshotState: {
      match,
      snapshotPath: '/path/to/test.snap',
    },
  } as unknown as Context;

  const matcherResult = toMatchSnapshot.call(mockedContext, {
    a: 1,
  });
  const inlineMatcherResult = toMatchInlineSnapshot.call(mockedContext, {
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
  expect(inlineMatcherResult).not.toHaveProperty('snapshotPath');
  expect(match).toHaveBeenCalledWith(expect.objectContaining({testIdentity}));
});

test('returns the snapshot path only for external failed property snapshots', () => {
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
    snapshotState: {
      expand: false,
      fail,
      snapshotPath: '/path/to/test.snap',
    },
    utils: {iterableEquality: jest.fn(), subsetEquality: jest.fn()},
  } as unknown as Context;
  const received = {value: 1};

  const matcherResult = toMatchSnapshot.call(mockedContext, received, {
    value: 2,
  });
  const inlineMatcherResult = toMatchInlineSnapshot.call(
    mockedContext,
    received,
    {value: 2},
  );

  expect(matcherResult).toEqual(
    expect.objectContaining({
      name: 'toMatchSnapshot',
      pass: false,
      snapshotPath: '/path/to/test.snap',
    }),
  );
  expect(inlineMatcherResult).not.toHaveProperty('snapshotPath');
  expect(fail).toHaveBeenCalledWith(
    'test name',
    received,
    undefined,
    testIdentity,
  );
});
