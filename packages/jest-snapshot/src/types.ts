/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {MatcherContext} from 'expect';
import type {PrettyFormatOptions} from 'pretty-format';
import type SnapshotState from './State';

export interface Context extends MatcherContext {
  snapshotState: SnapshotState;
}

// This is typically implemented by `jest-haste-map`'s `HasteFS`, but we
// partially reproduce the interface here to avoid a dependency.

export interface FileSystem {
  exists(path: string): boolean;
  matchFiles(pattern: RegExp | string): Array<string>;
}

export type MatchSnapshotConfig = {
  context: Context;
  hint?: string;
  inlineSnapshot?: string;
  isInline: boolean;
  matcherName: string;
  properties?: object;
  received: any;
};

export type SnapshotData = Record<string, string>;

export interface SnapshotMatchers<R extends void | Promise<void>, T> {
  /**
   * This ensures that a value matches the most recent snapshot with property matchers.
   * Check out [the Snapshot Testing guide](https://jestjs.io/docs/snapshot-testing) for more information.
   */
  toMatchSnapshot(hint?: string): R;
  /**
   * This ensures that a value matches the most recent snapshot.
   * Check out [the Snapshot Testing guide](https://jestjs.io/docs/snapshot-testing) for more information.
   */
  toMatchSnapshot<U extends Record<keyof T, unknown>>(
    propertyMatchers: Partial<U>,
    hint?: string,
  ): R;
  /**
   * This ensures that a value matches the most recent snapshot with property matchers.
   * Instead of writing the snapshot value to a .snap file, it will be written into the source code automatically.
   * Check out [the Snapshot Testing guide](https://jestjs.io/docs/snapshot-testing) for more information.
   */
  toMatchInlineSnapshot(snapshot?: string): R;
  /**
   * This ensures that a value matches the most recent snapshot with property matchers.
   * Instead of writing the snapshot value to a .snap file, it will be written into the source code automatically.
   * Check out [the Snapshot Testing guide](https://jestjs.io/docs/snapshot-testing) for more information.
   */
  toMatchInlineSnapshot<U extends Record<keyof T, unknown>>(
    propertyMatchers: Partial<U>,
    snapshot?: string,
  ): R;
  /**
   * Used to test that a function throws a error matching the most recent snapshot when it is called.
   */
  toThrowErrorMatchingSnapshot(hint?: string): R;
  /**
   * Used to test that a function throws a error matching the most recent snapshot when it is called.
   * Instead of writing the snapshot value to a .snap file, it will be written into the source code automatically.
   */
  toThrowErrorMatchingInlineSnapshot(snapshot?: string): R;
}

export type SnapshotFormat = Omit<PrettyFormatOptions, 'compareKeys'>;
