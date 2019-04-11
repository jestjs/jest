/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fc from 'fast-check';
import {
  anythingSettings,
  assertSettings,
} from './__arbitraries__/sharedSettings';

describe('toStrictEqual', () => {
  it('should be reflexive', () => {
    fc.assert(
      fc.property(fc.dedup(fc.anything(anythingSettings), 2), ([a, b]) => {
        // Given: a and b identical values
        expect(a).toStrictEqual(b);
      }),
      assertSettings,
    );
  });

  it('should be symmetric', () => {
    const safeExpectStrictEqual = (a, b) => {
      try {
        expect(a).toStrictEqual(b);
        return true;
      } catch (err) {
        return false;
      }
    };
    fc.assert(
      fc.property(
        fc.anything(anythingSettings),
        fc.anything(anythingSettings),
        (a, b) => {
          // Given:  a and b values
          // Assert: We expect `expect(a).toStrictEqual(b)`
          //         to be equivalent to `expect(b).toStrictEqual(a)`
          expect(safeExpectStrictEqual(a, b)).toBe(safeExpectStrictEqual(b, a));
        },
      ),
      assertSettings,
    );
  });
});
