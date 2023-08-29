/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {EventEmitter} from 'events';
import * as path from 'path';
import anymatch, {Matcher} from 'anymatch';
import * as fs from 'graceful-fs';
import micromatch = require('micromatch');
// @ts-expect-error no types
import walker from 'walker';

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
export class FSEventsWatcher extends EventEmitter {
  readonly root: string;
  readonly ignored?: Matcher;
  readonly glob: Array<string>;
  readonly dot: boolean;
  readonly hasIgnore: boolean;
  readonly doIgnore: (path: string) => boolean;
  readonly fsEventsWatchStopper: () => Promise<void>;
  private readonly _tracked: Set<string>;

  static isSupported(): boolean {
    return fsevents !== null;
  }

  private static normalizeProxy(
    callback: (normalizedPath: string, stats: fs.Stats) => void,
  ) {
    return (filepath: string, stats: fs.Stats): void =>
      callback(path.normalize(filepath), stats);
  }

  private static recReaddir(
    dir: string,
    dirCallback: (normalizedPath: string, stats: fs.Stats) => void,
    fileCallback: (normalizedPath: string, stats: fs.Stats) => void,
    endCallback: () => void,
    errorCallback: () => void,
    ignored?: Matcher,
  ) {
    walker(dir)
      .filterDir(
        (currentDir: string) => !ignored || !anymatch(ignored, currentDir),
      )
      .on('dir', FSEventsWatcher.normalizeProxy(dirCallback))
      .on('file', FSEventsWatcher.normalizeProxy(fileCallback))
      .on('error', errorCallback)
      .on('end', () => {
        endCallback();
      });
  }

  constructor(
    dir: string,
    opts: {
      root: string;
      ignored?: Matcher;
      glob: string | Array<string>;
      dot: boolean;
    },
  ) {
    if (!fsevents) {
      throw new Error(
        '`fsevents` unavailable (this watcher can only be used on Darwin)',
      );
    }

    super();

    this.dot = opts.dot || false;
    this.ignored = opts.ignored;
    this.glob = Array.isArray(opts.glob) ? opts.glob : [opts.glob];

    this.hasIgnore =
      Boolean(opts.ignored) && !(Array.isArray(opts) && opts.length > 0);
    this.doIgnore = opts.ignored ? anymatch(opts.ignored) : () => false;

    this.root = path.resolve(dir);
    this.fsEventsWatchStopper = fsevents.watch(
      this.root,
      this.handleEvent.bind(this),
    );

    this._tracked = new Set();
    FSEventsWatcher.recReaddir(
      this.root,
      (filepath: string) => {
        this._tracked.add(filepath);
      },
      (filepath: string) => {
        this._tracked.add(filepath);
      },
      this.emit.bind(this, 'ready'),
      this.emit.bind(this, 'error'),
      this.ignored,
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
    return this.glob.length
      ? micromatch([relativePath], this.glob, {dot: this.dot}).length > 0
      : this.dot || micromatch([relativePath], '**/*').length > 0;
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
