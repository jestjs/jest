/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {EventEmitter} from 'node:events';
import type {HasteRegExp} from '../types';

export type WatcherBackend =
  | 'auto'
  | 'watchman'
  | 'parcel'
  | 'fsevents'
  | 'node';

export type WatcherOptions = {
  dot: boolean;
  glob: ReadonlyArray<string>;
  ignored: HasteRegExp | undefined;
};

export type WatcherEventType = 'add' | 'change' | 'delete';

export interface IWatcher extends EventEmitter {
  close(): Promise<void>;
}

export type WatcherCtor = new (root: string, opts: WatcherOptions) => IWatcher;
