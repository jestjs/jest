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
import NodeWatcher from './NodeWatcher';
// @ts-expect-error: not converted to TypeScript - it's a fork: https://github.com/jestjs/jest/pull/5387
import WatchmanWatcher from './WatchmanWatcher';

type WatcherInstance = {close(): Promise<void>};

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
  private _watchers: Array<WatcherInstance> = [];

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
    const Backend = this._useWatchman
      ? WatchmanWatcher
      : FSEventsWatcher.isSupported()
        ? FSEventsWatcher
        : NodeWatcher;

    this._watchers = await Promise.all(
      this._roots.map(root => this._createWatcher(Backend, root, onChange)),
    );
  }

  async close(): Promise<void> {
    await Promise.all(this._watchers.map(watcher => watcher.close()));
    this._watchers = [];
  }

  private _createWatcher(
    Backend: any,
    root: string,
    onChange: OnChangeCallback,
  ): Promise<WatcherInstance> {
    const watcher = new Backend(root, {
      dot: true,
      glob: this._extensions.map(ext => `**/*.${ext}`),
      ignored: this._ignorePattern,
    });

    return new Promise((resolve, reject) => {
      const rejectTimeout = setTimeout(
        () => reject(new Error('Failed to start watch mode.')),
        MAX_WAIT_TIME,
      );

      watcher.once('ready', () => {
        clearTimeout(rejectTimeout);
        watcher.on('all', onChange);
        resolve(watcher);
      });
    });
  }
}
