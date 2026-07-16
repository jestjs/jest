/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {EventEmitter} from 'node:events';
import * as path from 'node:path';
import anymatch from 'anymatch';
import * as fs from 'graceful-fs';
import {globsToMatcher} from 'jest-util';
import {walk} from '../lib/walk';
import type {HasteRegExp} from '../types';
import type {IWatcher, WatcherOptions} from './types';

// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
// @ts-ignore: this is for CI which runs linux and might not have this
let fsevents: typeof import('fsevents') | null = null;
try {
  fsevents = require('fsevents');
} catch {
  // Optional dependency, only supported on Darwin.
}

const CHANGE_EVENT = 'change';
const DELETE_EVENT = 'delete';
const ADD_EVENT = 'add';
const ALL_EVENT = 'all';

type FsEventsWatcherEvent =
  | typeof CHANGE_EVENT
  | typeof DELETE_EVENT
  | typeof ADD_EVENT
  | typeof ALL_EVENT;

/**
 * Export `FSEventsWatcher` class.
 * Watches `dir`.
 */
export class FSEventsWatcher extends EventEmitter implements IWatcher {
  readonly root: string;
  readonly ignored: HasteRegExp | undefined;
  readonly glob: Array<string>;
  readonly dot: boolean;
  readonly hasIgnore: boolean;
  readonly doIgnore: (path: string) => boolean;
  readonly fsEventsWatchStopper: () => Promise<void>;
  private readonly _tracked: Set<string>;

  static isSupported(): boolean {
    return fsevents !== null;
  }

  constructor(dir: string, opts: WatcherOptions) {
    if (!fsevents) {
      throw new Error(
        '`fsevents` unavailable (this watcher can only be used on Darwin)',
      );
    }

    super();

    this.dot = opts.dot || false;
    this.ignored = opts.ignored;
    this.glob = [...opts.glob];

    this.hasIgnore = Boolean(opts.ignored);
    this.doIgnore = opts.ignored ? anymatch(opts.ignored) : () => false;

    this.root = path.resolve(dir);
    this.fsEventsWatchStopper = fsevents.watch(
      this.root,
      this.handleEvent.bind(this),
    );

    this._tracked = new Set();
    walk(
      {
        exclude: this.hasIgnore ? this.doIgnore : undefined,
        includeDirs: true,
        onEntry: (_kind, filePath) => {
          this._tracked.add(filePath);
        },
        onError: this.emit.bind(this, 'error'),
        root: this.root,
        statCache: opts.statCache,
      },
      err => {
        if (err) {
          this.emit('error', err);
        } else {
          this.emit('ready');
        }
      },
    );
  }

  /**
   * End watching.
   */
  async close(callback?: () => void): Promise<void> {
    await this.fsEventsWatchStopper();
    this.removeAllListeners();
    if (typeof callback === 'function') {
      process.nextTick(() => callback());
    }
  }

  private isFileIncluded(relativePath: string) {
    if (this.doIgnore(relativePath)) {
      return false;
    }
    return this.glob.length > 0
      ? globsToMatcher(this.glob, {dot: this.dot})(relativePath)
      : this.dot || globsToMatcher(['**/*'])(relativePath);
  }

  private handleEvent(filepath: string) {
    const relativePath = path.relative(this.root, filepath);
    if (!this.isFileIncluded(relativePath)) {
      return;
    }

    fs.lstat(filepath, (error, stat) => {
      if (error && error.code !== 'ENOENT') {
        this.emit('error', error);
        return;
      }

      if (error) {
        // Ignore files that aren't tracked and don't exist.
        if (!this._tracked.has(filepath)) {
          return;
        }

        this._emit(DELETE_EVENT, relativePath);
        this._tracked.delete(filepath);
        return;
      }

      if (this._tracked.has(filepath)) {
        this._emit(CHANGE_EVENT, relativePath, stat);
      } else {
        this._tracked.add(filepath);
        this._emit(ADD_EVENT, relativePath, stat);
      }
    });
  }

  /**
   * Emit events.
   */
  private _emit(type: FsEventsWatcherEvent, file: string, stat?: fs.Stats) {
    this.emit(type, file, this.root, stat);
    this.emit(ALL_EVENT, type, file, this.root, stat);
  }
}
