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

/**
 * Replaces `T` with `T | AsymmetricMatcher`, recursing into nested objects and
 * arrays:
 * ```ts
 * type DeepAsymmetricMatcher<boolean>; // AsymmetricMatcher | boolean
 * type DeepAsymmetricMatcher<{ foo: number }>; // AsymmetricMatcher | { foo: AsymmetricMatcher | number }
 * type DeepAsymmetricMatcher<[string]>; // AsymmetricMatcher | [AsymmetricMatcher | string]
 * ```
 */
type DeepAsymmetricMatcher<T> = T extends object
  ? AsymmetricMatcher | {[K in keyof T]: DeepAsymmetricMatcher<T[K]>}
  : AsymmetricMatcher | T;

/**
 * Maps each parameter slot of a tuple to `T | AsymmetricMatcher` (recursively
 * via {@link DeepAsymmetricMatcher}). Falls back to `never` for the
 * `Array<unknown>` "any-shape" case so that {@link FunctionParameters} can
 * collapse it back to `Array<unknown>` for `UnknownFunction`-like mocks.
 */
type WithAsymmetricMatchers<P extends Array<any>> =
  Array<unknown> extends P
    ? never
    : {[K in keyof P]: DeepAsymmetricMatcher<P[K]>};

/**
 * Like the built-in `Parameters<F>` utility type, but each parameter accepts an
 * asymmetric matcher (recursively for nested objects), and overloaded functions
 * yield a union of all overload parameter tuples.
 */
export type FunctionParameters<F> =
  FunctionParametersInternal<F> extends never
    ? Array<unknown>
    : FunctionParametersInternal<F>;

/**
 * 1. If the function is overloaded or has no parameters → overloaded form
 *    (union of tuples, up to 15 overloads).
 * 2. If the function has parameters → simple form.
 * 3. else → `never`.
 */
type FunctionParametersInternal<F> = F extends {
  (...args: infer P1): any;
  (...args: infer P2): any;
  (...args: infer P3): any;
  (...args: infer P4): any;
  (...args: infer P5): any;
  (...args: infer P6): any;
  (...args: infer P7): any;
  (...args: infer P8): any;
  (...args: infer P9): any;
  (...args: infer P10): any;
  (...args: infer P11): any;
  (...args: infer P12): any;
  (...args: infer P13): any;
  (...args: infer P14): any;
  (...args: infer P15): any;
}
  ?
      | WithAsymmetricMatchers<P1>
      | WithAsymmetricMatchers<P2>
      | WithAsymmetricMatchers<P3>
      | WithAsymmetricMatchers<P4>
      | WithAsymmetricMatchers<P5>
      | WithAsymmetricMatchers<P6>
      | WithAsymmetricMatchers<P7>
      | WithAsymmetricMatchers<P8>
      | WithAsymmetricMatchers<P9>
      | WithAsymmetricMatchers<P10>
      | WithAsymmetricMatchers<P11>
      | WithAsymmetricMatchers<P12>
      | WithAsymmetricMatchers<P13>
      | WithAsymmetricMatchers<P14>
      | WithAsymmetricMatchers<P15>
  : F extends (...args: infer P) => any
    ? WithAsymmetricMatchers<P>
    : never;
