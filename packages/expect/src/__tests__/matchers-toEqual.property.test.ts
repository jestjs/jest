/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {fc, itProp} from '@fast-check/jest';
import expect from '../';
import {
  anythingSettings,
  assertSettings,
} from './__arbitraries__/sharedSettings';

describe('toEqual', () => {
  itProp(
    'should be reflexive',
    [fc.clone(fc.anything(anythingSettings), 2)],
    ([a, b]) => {
      // Given: a and b identical values
      expect(a).toEqual(b);
    },
    assertSettings,
  );

  const safeExpectEqual = (a: unknown, b: unknown) => {
    try {
      expect(a).toEqual(b);
      return true;
    } catch {
      return false;
    }
  };

  itProp(
    'should be symmetric',
    [fc.anything(anythingSettings), fc.anything(anythingSettings)],
    (a, b) => {
      // Given:  a and b values
      // Assert: We expect `expect(a).toEqual(b)`
      //         to be equivalent to `expect(b).toEqual(a)`
      expect(safeExpectEqual(a, b)).toBe(safeExpectEqual(b, a));
    },
    {
      ...assertSettings,
      examples: [
        [0, 5e-324], // Issue #7941
        // [
        //   new Set([false, true]),
        //   new Set([new Boolean(true), new Boolean(true)]),
        // ], // Issue #7975
      ],
    },
  );
});
