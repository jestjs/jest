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

describe('toContainEqual', () => {
  it.prop(
    [
      fc.array(fc.anything(anythingSettings)),
      fc.array(fc.anything(anythingSettings)),
      fc.anything(anythingSettings),
    ],
    assertSettings,
  )(
    'should always find the value when inside the array',
    (startValues, endValues, v) => {
      // Given: startValues, endValues arrays and v any value
      expect([...startValues, v, ...endValues]).toContainEqual(v);
    },
  );

  it.prop(
    [
      fc.array(fc.anything(anythingSettings)),
      fc.array(fc.anything(anythingSettings)),
      fc.clone(fc.anything(anythingSettings), 2),
    ],
    assertSettings,
  )(
    'should always find the value when cloned inside the array',
    (startValues, endValues, [a, b]) => {
      // Given: startValues, endValues arrays
      //        and [a, b] identical values
      expect([...startValues, a, ...endValues]).toContainEqual(b);
    },
  );
});
