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

describe('toContainEqual', () => {
  itProp(
    'should always find the value when inside the array',
    [
      fc.array(fc.anything(anythingSettings)),
      fc.array(fc.anything(anythingSettings)),
      fc.anything(anythingSettings),
    ],
    (startValues, endValues, v) => {
      // Given: startValues, endValues arrays and v any value
      expect([...startValues, v, ...endValues]).toContainEqual(v);
    },
    assertSettings,
  );

  itProp(
    'should always find the value when cloned inside the array',
    [
      fc.array(fc.anything(anythingSettings)),
      fc.array(fc.anything(anythingSettings)),
      fc.clone(fc.anything(anythingSettings), 2),
    ],
    (startValues, endValues, [a, b]) => {
      // Given: startValues, endValues arrays
      //        and [a, b] identical values
      expect([...startValues, a, ...endValues]).toContainEqual(b);
    },
    assertSettings,
  );
});
