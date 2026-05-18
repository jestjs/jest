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
 * Extracts the call signatures of a function type as a union of
 * `(...args) => returnType` types. Supports up to 15 overloads. For
 * non-overloaded functions, returns the function type unchanged. Falls back to
 * `never` for non-function types. This lets downstream utility types (e.g.
 * `Parameters<S>`, `ReturnType<S>`) distribute over each overload instead of
 * collapsing to the last one.
 */
export type FunctionSignatures<F> = F extends {
  (...args: infer A1): infer R1;
  (...args: infer A2): infer R2;
  (...args: infer A3): infer R3;
  (...args: infer A4): infer R4;
  (...args: infer A5): infer R5;
  (...args: infer A6): infer R6;
  (...args: infer A7): infer R7;
  (...args: infer A8): infer R8;
  (...args: infer A9): infer R9;
  (...args: infer A10): infer R10;
  (...args: infer A11): infer R11;
  (...args: infer A12): infer R12;
  (...args: infer A13): infer R13;
  (...args: infer A14): infer R14;
  (...args: infer A15): infer R15;
}
  ?
      | ((...args: A1) => R1)
      | ((...args: A2) => R2)
      | ((...args: A3) => R3)
      | ((...args: A4) => R4)
      | ((...args: A5) => R5)
      | ((...args: A6) => R6)
      | ((...args: A7) => R7)
      | ((...args: A8) => R8)
      | ((...args: A9) => R9)
      | ((...args: A10) => R10)
      | ((...args: A11) => R11)
      | ((...args: A12) => R12)
      | ((...args: A13) => R13)
      | ((...args: A14) => R14)
      | ((...args: A15) => R15)
  : F extends (...args: any) => any
    ? F
    : never;

/**
 * Like the built-in `Parameters<F>` utility type, but each parameter accepts an
 * asymmetric matcher (recursively for nested objects), and overloaded functions
 * yield a union of all overload parameter tuples.
 */
export type FunctionParameters<F> =
  FunctionParametersInternal<F> extends never
    ? Array<unknown>
    : FunctionParametersInternal<F>;

type FunctionParametersInternal<F> =
  FunctionSignatures<F> extends infer S
    ? S extends (...args: infer P) => any
      ? WithAsymmetricMatchers<P>
      : never
    : never;
