/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import assert from 'assert';
import {onNodeVersions} from '@jest/test-utils';
import fc from 'fast-check';
import expect from '..';
import {
  anythingSettings,
  assertSettings,
} from './__arbitraries__/sharedSettings';

describe('toStrictEqual', () => {
  const safeExpectStrictEqual = (a, b) => {
    try {
      expect(a).toStrictEqual(b);
      return true;
    } catch (err) {
      return false;
    }
  };
  const safeAssertDeepStrictEqual = (a, b) => {
    try {
      assert.deepStrictEqual(a, b);
      return true;
    } catch (err) {
      return false;
    }
  };
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

  onNodeVersions('>=9', () => {
    it('should be equivalent to Node deepStrictEqual', () => {
      fc.assert(
        fc.property(
          fc.anything(anythingSettings),
          fc.anything(anythingSettings),
          (a, b) => {
            expect(safeExpectStrictEqual(a, b)).toBe(
              safeAssertDeepStrictEqual(a, b),
            );
          },
        ),
        assertSettings,
      );
    });
  });
});
