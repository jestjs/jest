/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

const {toMatchSnapshot} = require('../');

it(`matcher returns matcher name, expected and actual values`, () => {
  const actual = 'a';
  const expected = 'b';
  const matcher = toMatchSnapshot.bind({
    snapshotState: {match: (testName, received) => ({actual, expected})},
  });

  const matcherResult = matcher({a: 1});

  expect(matcherResult).toEqual(
    expect.objectContaining({
      actual,
      expected,
      name: 'toMatchSnapshot',
    }),
  );
});

it(`throws the error stack when match throws an error`, () => {
  const error = new Error();

  const matcher = toMatchSnapshot.bind({
    snapshotState: {
      match: () => {
        throw error;
      },
    },
  });

  expect(() => matcher()).toThrow(error.stack);
});
