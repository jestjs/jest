/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from '@jest/globals';

expect.extend({
  toBeWithinRange(actual: number, floor: number, ceiling: number) {
    const pass = actual >= floor && actual <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${actual} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${actual} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

declare module '@jest/types' {
  namespace Expect {
    interface AsymmetricMatchers {
      toBeWithinRange(a: number, b: number): AsymmetricMatcher;
    }
    interface Matchers<R> {
      toBeWithinRange(a: number, b: number): R;
    }
  }
}
