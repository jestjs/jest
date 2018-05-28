/**
 * Copyright (c) 2018-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe.only.each([[true, true], [true, true]])(
  'passes all rows expected %s == %s',
  (left, right) => {
    it('passes', () => {
      expect(left).toBe(right);
    });
  }
);

// This failing tests should never because of the above `only` so the suite
// should pass
describe.each([[false, true]])(
  'fails all rows expected %s == %s',
  (left, right) => {
    it('fails', () => {
      expect(left).toBe(right);
    });
  }
);
