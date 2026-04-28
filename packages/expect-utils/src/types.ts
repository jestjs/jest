/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {EqualsFunction} from './jasmineUtils';

export type Tester = (
  this: TesterContext,
  a: any,
  b: any,
  customTesters: Array<Tester>,
) => boolean | undefined;

export interface TesterContext {
  equals: EqualsFunction;
}

/**
 * Structural type for any object honoring Jest's asymmetric matcher protocol
 * (e.g. `expect.any(...)`, `expect.objectContaining(...)`). Detected at runtime
 * by {@link equals}.
 */
export type AsymmetricMatcher = {
  asymmetricMatch(other: unknown): boolean;
  toString(): string;
  getExpectedType?(): string;
  toAsymmetricMatcher?(): string;
};
