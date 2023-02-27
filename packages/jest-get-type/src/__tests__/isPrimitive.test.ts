/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {isPrimitive} from '..';

describe('.isPrimitive()', () => {
  test.each([
    null,
    undefined,
    100,
    'hello world',
    true,
    Symbol.for('a'),
    0,
    NaN,
    Infinity,
    BigInt(1),
  ])('returns true when given primitive value of: %s', primitive => {
    expect(isPrimitive(primitive)).toBe(true);
  });

  test.each([
    {},
    [],
    () => {},
    /abc/,
    new Map(),
    new Set(),
    new Date(),
    Object.create(null),
  ])('returns false when given non primitive value of: %j', value => {
    expect(isPrimitive(value)).toBe(false);
  });
});
