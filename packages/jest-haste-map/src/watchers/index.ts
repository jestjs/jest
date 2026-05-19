/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Stats} from 'graceful-fs';
import isWatchmanInstalled from '../lib/isWatchmanInstalled';
import type {HasteRegExp} from '../types';
import {FSEventsWatcher} from './FSEventsWatcher';
// @ts-expect-error: not converted to TypeScript - it's a fork: https://github.com/jestjs/jest/pull/10919
import NodeWatcherImpl from './NodeWatcher';
// @ts-expect-error: not converted to TypeScript - it's a fork: https://github.com/jestjs/jest/pull/5387
import WatchmanWatcherImpl from './WatchmanWatcher';
import type {IWatcher, WatcherCtor} from './types';

const NodeWatcher = NodeWatcherImpl as WatcherCtor;
const WatchmanWatcher = WatchmanWatcherImpl as WatcherCtor;

let isWatchmanInstalledPromise: Promise<boolean> | undefined;

export async function shouldUseWatchman(
  useWatchmanOption: boolean,
): Promise<boolean> {
  if (!useWatchmanOption) {
    return false;
  }
  if (!isWatchmanInstalledPromise) {
    isWatchmanInstalledPromise = isWatchmanInstalled();
  }
  return isWatchmanInstalledPromise;
}

type OnChangeCallback = (
  type: string,
  filePath: string,
  root: string,
  stat?: Stats,
) => void;

const MAX_WAIT_TIME = 240_000;

export class WatcherDriver {
  private readonly _extensions: Array<string>;
  private readonly _ignorePattern: HasteRegExp | undefined;
  private readonly _roots: Array<string>;
  private readonly _useWatchman: boolean;
  private _watchers: Array<IWatcher> = [];

  constructor(opts: {
    extensions: Array<string>;
    ignorePattern: HasteRegExp | undefined;
    roots: Array<string>;
    useWatchman: boolean;
  }) {
    this._extensions = opts.extensions;
    this._ignorePattern = opts.ignorePattern;
    this._roots = opts.roots;
    this._useWatchman = opts.useWatchman;
  }

  async start(onChange: OnChangeCallback): Promise<void> {
    const Backend: WatcherCtor = this._useWatchman
      ? WatchmanWatcher
      : FSEventsWatcher.isSupported()
        ? (FSEventsWatcher as unknown as WatcherCtor)
        : NodeWatcher;

    const statCache = new Map<string, Stats>();
    const results = await Promise.allSettled(
      this._roots.map(root =>
        this._createWatcher(Backend, root, onChange, statCache),
      ),
    );
    const fulfilled = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<IWatcher>).value);
    const rejected = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason);
    if (rejected.length > 0) {
      await Promise.allSettled(fulfilled.map(w => w.close()));
      throw new AggregateError(rejected, 'Failed to start watch mode.');
    }
    this._watchers = fulfilled;
  }

  async close(): Promise<void> {
    await Promise.all(this._watchers.map(watcher => watcher.close()));
    this._watchers = [];
  }

  private _createWatcher(
    Backend: WatcherCtor,
    root: string,
    onChange: OnChangeCallback,
    statCache: Map<string, Stats>,
  ): Promise<IWatcher> {
    const watcher = new Backend(root, {
      dot: true,
      glob: this._extensions.map(ext => `**/*.${ext}`),
      ignored: this._ignorePattern,
      statCache,
    });

    return new Promise((resolve, reject) => {
      const onReady = () => {
        clearTimeout(rejectTimeout);
        watcher.on('all', onChange);
        resolve(watcher);
      };
      const rejectTimeout = setTimeout(() => {
        watcher.off('ready', onReady);
        watcher.close().catch(() => undefined);
        reject(new Error('Failed to start watch mode.'));
      }, MAX_WAIT_TIME);

      watcher.once('ready', onReady);
    });
  }
}
