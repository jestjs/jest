/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from '@jest/globals';
import type {MatcherFunction} from 'expect';

const toBeWithinRange: MatcherFunction<[floor: number, ceiling: number]> = (
  actual: unknown,
  floor: unknown,
  ceiling: unknown,
) => {
  if (
    typeof actual !== 'number' ||
    typeof floor !== 'number' ||
    typeof ceiling !== 'number'
  ) {
    throw new Error('These must be of type number!');
  }

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
};

expect.extend({
  toBeWithinRange,
});

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeWithinRange(a: number, b: number): void;
  }
  interface Matchers<R> {
    toBeWithinRange(a: number, b: number): R;
  }
}
