/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {fc, it} from '@fast-check/jest';
import expect from '../';
import {
  anythingSettings,
  assertSettings,
} from './__arbitraries__/sharedSettings';

describe('toEqual', () => {
  it.prop([fc.clone(fc.anything(anythingSettings), 2)], assertSettings)(
    'should be reflexive',
    ([a, b]) => {
      // Given: a and b identical values
      expect(a).toEqual(b);
    },
  );

  const safeExpectEqual = (a: unknown, b: unknown) => {
    try {
      expect(a).toEqual(b);
      return true;
    } catch {
      return false;
    }
  };

  it.prop([fc.anything(anythingSettings), fc.anything(anythingSettings)], {
    ...assertSettings,
    examples: [
      [0, 5e-324], // Issue #7941
      // [
      //   new Set([false, true]),
      //   new Set([new Boolean(true), new Boolean(true)]),
      // ], // Issue #7975
    ],
  })('should be symmetric', (a, b) => {
    // Given:  a and b values
    // Assert: We expect `expect(a).toEqual(b)`
    //         to be equivalent to `expect(b).toEqual(a)`
    expect(safeExpectEqual(a, b)).toBe(safeExpectEqual(b, a));
  });
});
