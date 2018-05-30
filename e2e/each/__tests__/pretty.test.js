/**
 * Copyright (c) 2018-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const noop = () => {};

it.each([
  ['hello', 'hello'],
  [1, 1],
  [null, null],
  [undefined, undefined],
  [1.2, 1.2],
  [{foo: 'bar'}, {foo: 'bar'}],
  [{foo: {bar: 'baz'}}, {foo: {bar: 'baz'}}],
  [noop, noop],
  [[], []],
  [[{foo: {bar: 'baz'}}], [{foo: {bar: 'baz'}}]],
  [Infinity, Infinity],
  [-Infinity, -Infinity],
  [NaN, NaN],
])('%p == %p', (left, right) => {
  expect(left).toEqual(right);
});
