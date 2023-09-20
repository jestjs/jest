/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {strict as assert} from 'assert';
import {fc, it} from '@fast-check/jest';
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

  it.prop([fc.clone(fc.anything(anythingSettings), 2)], assertSettings)(
    'should be reflexive',
    ([a, b]) => {
      // Given: a and b identical values
      expect(a).toStrictEqual(b);
    },
  );

  it.prop(
    [fc.anything(anythingSettings), fc.anything(anythingSettings)],
    assertSettings,
  )('should be symmetric', (a, b) => {
    // Given:  a and b values
    // Assert: We expect `expect(a).toStrictEqual(b)`
    //         to be equivalent to `expect(b).toStrictEqual(a)`
    expect(safeExpectStrictEqual(a, b)).toBe(safeExpectStrictEqual(b, a));
  });

  it.prop(
    [fc.anything(anythingSettings), fc.anything(anythingSettings)],
    assertSettings,
  )('should be equivalent to Node deepStrictEqual', (a, b) => {
    expect(safeExpectStrictEqual(a, b)).toBe(safeAssertDeepStrictEqual(a, b));
  });
});
