/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {withoutCircularRefs} from '../withoutCircularRefs';

it('test simple values', () => {
  expect(withoutCircularRefs(undefined)).toBeUndefined();
  expect(withoutCircularRefs(null)).toBeNull();
  expect(withoutCircularRefs(0)).toBe(0);
  expect(withoutCircularRefs('12')).toBe('12');
  expect(withoutCircularRefs(true)).toBe(true);
  expect(withoutCircularRefs([1])).toEqual([1]);
  expect(withoutCircularRefs({a: 1, b: {c: 2}})).toEqual({a: 1, b: {c: 2}});
});

it('test circular values', () => {
  const circular = {self: undefined as any};
  circular.self = circular;

  expect(withoutCircularRefs(circular)).toEqual({self: '[Circular]'});

  expect(withoutCircularRefs([{a: circular, b: null}])).toEqual([
    {a: {self: '[Circular]'}, b: null},
  ]);

  expect(withoutCircularRefs({a: {b: circular}, c: undefined})).toEqual({
    a: {b: {self: '[Circular]'}, c: undefined},
  });
});
