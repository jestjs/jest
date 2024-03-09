/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, test} from 'tstyche';
import {jestExpect} from '@jest/expect';
import {expect as _expect} from 'expect';

declare module 'expect' {
  interface Matchers<R, T> {
    toTypedEqual(expected: T): void;
  }
}

describe('JestExpect', () => {
  test('defines the `.toMatchSnapshot()` matcher', () => {
    expect(jestExpect(null)).type.toHaveProperty('toMatchSnapshot');

    expect(_expect(null)).type.not.toHaveProperty('toMatchSnapshot');
  });

  test('defines the `.addSnapshotSerializer()` method', () => {
    expect(jestExpect).type.toHaveProperty('addSnapshotSerializer');

    expect(_expect).type.not.toHaveProperty('addSnapshotSerializer');
  });

  test('is superset of `Expect`', () => {
    expect<typeof jestExpect>().type.toMatch<typeof _expect>();

    expect<typeof _expect>().type.not.toMatch<typeof jestExpect>();
  });

  test('allows type inference of the `actual` argument', () => {
    expect(jestExpect(100).toTypedEqual(100)).type.toBeVoid();
    expect(jestExpect(101).not.toTypedEqual(100)).type.toBeVoid();

    expect(jestExpect(100).toTypedEqual('three')).type.toRaiseError(
      "Argument of type 'string' is not assignable to parameter of type 'number'.",
    );
  });
});
