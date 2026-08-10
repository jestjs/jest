/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type Context, toMatchSnapshot} from '../';

test('returns matcher name, expected and actual values', () => {
  const mockedContext = {
    snapshotState: {
      match: () => ({actual: 'a', expected: 'b'}),
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
});
