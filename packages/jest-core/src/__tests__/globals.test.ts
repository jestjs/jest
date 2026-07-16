/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('Common globals', () => {
  it('check process', () => {
    if (Symbol && Symbol.toStringTag) {
      expect(Object.prototype.toString.call(process)).toBe('[object process]');
    }
  });
});
