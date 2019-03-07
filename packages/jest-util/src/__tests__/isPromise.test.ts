/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import isPromise from '../isPromise';

describe('not a Promise: ', () => {
  test.each([undefined, null, true, 42, '1337', Symbol(), [], {}])(
    '%p',
    value => {
      expect(isPromise(value)).toBe(false);
    },
  );
});

test('a resolved Promise', () => {
  expect(isPromise(Promise.resolve(42))).toBe(true);
});

test('a rejected Promise', () => {
  expect(isPromise(Promise.reject().catch(() => {}))).toBe(true);
});
