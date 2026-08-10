/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, test} from 'tstyche';
import {expect as _expect} from 'expect';

declare module 'expect' {
  interface Matchers<R, T> {
    toTypedEqual(expected: T): void;
  }
}

describe('Expect', () => {
  test('allows type inference of the `actual` argument', () => {
    expect(_expect(100).toTypedEqual(100)).type.toBe<void>();
    expect(_expect(101).not.toTypedEqual(100)).type.toBe<void>();

    expect(_expect(100).toTypedEqual).type.not.toBeCallableWith('three');
  });
});
