/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fc from 'fast-check';
import expect from '..';
import {
  anythingSettings,
  assertSettings,
} from './__arbitraries__/sharedSettings';

describe('toContain', () => {
  it('should always find the value when inside the array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.anything(anythingSettings)),
        fc.array(fc.anything(anythingSettings)),
        fc.anything(anythingSettings).filter(v => !Number.isNaN(v)),
        (startValues, endValues, v) => {
          // Given: startValues, endValues arrays and v value (not NaN)
          expect([...startValues, v, ...endValues]).toContain(v);
        },
      ),
      assertSettings,
    );
  });

  it('should not find the value if it has been cloned into the array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.anything(anythingSettings)),
        fc.array(fc.anything(anythingSettings)),
        fc.dedup(fc.anything(anythingSettings), 2),
        (startValues, endValues, [a, b]) => {
          // Given: startValues, endValues arrays
          //        and [a, b] equal, but not the same values
          //        with `typeof a === 'object && a !== null`
          fc.pre(typeof a === 'object' && a !== null);
          expect([...startValues, a, ...endValues]).not.toContain(b);
        },
      ),
      assertSettings,
    );
  });
});
