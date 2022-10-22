/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {strict as assert} from 'assert';
import {fc, itProp} from '@fast-check/jest';
import expect from '../';
import {
  anythingSettings,
  assertSettings,
} from './__arbitraries__/sharedSettings';

describe('toStrictEqual', () => {
  const safeExpectStrictEqual = (a: unknown, b: unknown) => {
    try {
      expect(a).toStrictEqual(b);
      return true;
    } catch {
      return false;
    }
  };
  const safeAssertDeepStrictEqual = (a: unknown, b: unknown) => {
    try {
      assert.deepStrictEqual(a, b);
      return true;
    } catch {
      return false;
    }
  };

  itProp(
    'should be reflexive',
    [fc.clone(fc.anything(anythingSettings), 2)],
    ([a, b]) => {
      // Given: a and b identical values
      expect(a).toStrictEqual(b);
    },
    assertSettings,
  );

  itProp(
    'should be symmetric',
    [fc.anything(anythingSettings), fc.anything(anythingSettings)],
    (a, b) => {
      // Given:  a and b values
      // Assert: We expect `expect(a).toStrictEqual(b)`
      //         to be equivalent to `expect(b).toStrictEqual(a)`
      expect(safeExpectStrictEqual(a, b)).toBe(safeExpectStrictEqual(b, a));
    },
    assertSettings,
  );

  itProp(
    'should be equivalent to Node deepStrictEqual',
    [fc.anything(anythingSettings), fc.anything(anythingSettings)],
    (a, b) => {
      expect(safeExpectStrictEqual(a, b)).toBe(safeAssertDeepStrictEqual(a, b));
    },
    assertSettings,
  );
});
