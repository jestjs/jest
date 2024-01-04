/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

it.each([
  {something: {nested: 'value'}},
  {something: null},
  {something: undefined},
])('allows templating "$something.nested"', value => {
  expect(value).toBe(value);
});

it.each([{array: ['some value']}, {array: null}, {array: undefined}])(
  'allows templating "$array.length"',
  value => {
    expect(value).toBe(value);
  },
);
