/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from '@jest/globals';

describe('error stack traces', () => {
  it('passing test', () => {
    expect(1 + 1).toBe(2);
  });

  it.skip('skipped test should not run', () => {
    throw new Error('This should not run');
  });
});
