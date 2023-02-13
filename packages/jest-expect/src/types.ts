/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {AsymmetricMatchers, BaseExpect, Matchers} from 'expect';
import type {
  SnapshotMatchers,
  SnapshotState,
  addSerializer,
} from 'jest-snapshot';

export type JestExpect = {
  <T = unknown>(actual: T): JestMatchers<void, T> &
    Inverse<JestMatchers<void, T>> &
    PromiseMatchers<T>;
  // Duplicated due to https://github.com/microsoft/rushstack/issues/1709
  addSnapshotSerializer: typeof addSerializer;
} & BaseExpect &
  AsymmetricMatchers &
  Inverse<Omit<AsymmetricMatchers, 'any' | 'anything'>>;

type Inverse<Matchers> = {
  /**
   * Inverse next matcher. If you know how to test something, `.not` lets you test its opposite.
   */
  not: Matchers;
};

type JestMatchers<R extends void | Promise<void>, T> = Matchers<R, T> &
  SnapshotMatchers<R, T>;

type PromiseMatchers<T = unknown> = {
  /**
   * Unwraps the reason of a rejected promise so any other matcher can be chained.
   * If the promise is fulfilled the assertion fails.
   */
  rejects: JestMatchers<Promise<void>, T> &
    Inverse<JestMatchers<Promise<void>, T>>;
  /**
   * Unwraps the value of a fulfilled promise so any other matcher can be chained.
   * If the promise is rejected the assertion fails.
   */
  resolves: JestMatchers<Promise<void>, T> &
    Inverse<JestMatchers<Promise<void>, T>>;
};

declare module 'expect' {
  interface MatcherState {
    snapshotState: SnapshotState;
  }
  interface BaseExpect {
    addSnapshotSerializer: typeof addSerializer;
  }
}
