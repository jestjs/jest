/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'node:events';
import * as path from 'node:path';
import * as parcelWatcher from '@parcel/watcher';
import anymatch from 'anymatch';
import * as fs from 'graceful-fs';
import {
  ADD_EVENT,
  ALL_EVENT,
  CHANGE_EVENT,
  DELETE_EVENT,
  isFileIncluded,
} from './common';
import type {IWatcher, WatcherOptions} from './types';

// WatcherDriver always instantiates WatchmanWatcher directly when useWatchman
// is true, so the 'watchman' branch below is unreachable through normal Jest
// operation. It exists so ParcelWatcher can be used standalone (e.g. in tests
// or custom tooling) with watchman as the parcel backend.
function pickBackend(
  useWatchman: boolean,
): parcelWatcher.BackendType | undefined {
  if (useWatchman) {
    return 'watchman';
  }
  switch (process.platform) {
    case 'darwin':
      return 'fs-events';
    case 'linux':
      return 'inotify';
    case 'win32':
      return 'windows';
    default:
      // Jest only supports the three platforms above. Elsewhere, omit the
      // option so parcel's own default resolution picks the best compiled
      // backend
      return undefined;
  }
}

// Both forms are needed: the bare glob prunes the directory itself from
// parcel's initial scan, while the `/**` variant filters per-event paths —
// fs-events delivers paths inside the directory that only match the latter.
const VCS_IGNORE_GLOBS = [
  '**/.git',
  '**/.git/**',
  '**/.hg',
  '**/.hg/**',
  '**/.sl',
  '**/.sl/**',
];

export class ParcelWatcher extends EventEmitter implements IWatcher {
  readonly root: string;
  private readonly _dot: boolean;
  private readonly _glob: ReadonlyArray<string>;
  private readonly _doIgnore: (path: string) => boolean;
  private readonly _backend: parcelWatcher.BackendType | undefined;
  private _parcelIgnore: NonNullable<parcelWatcher.Options['ignore']>;
  private _subscription: parcelWatcher.AsyncSubscription | null = null;
  private _closed = false;

  constructor(root: string, opts: WatcherOptions) {
    super();
    this.root = path.resolve(root);
    this._dot = opts.dot;
    this._glob = opts.glob;
    // Fallback for patterns parcel's native matcher can't take: flagged
    // regexes, and sources std::regex rejects or matches differently.
    this._doIgnore = opts.ignored ? anymatch(opts.ignored) : () => false;
    this._backend = pickBackend(opts.useWatchman);
    // Parcel matches the pattern against the path relative to the watched
    // root, same as isFileIncluded does — but flags are unsupported. The VCS
    // globs are always appended: the path parcel matches has no leading
    // separator, so HasteMap's separator-anchored VCS alternation
    // (`/\.git/|…`) never matches the root's own `.git` directory.
    this._parcelIgnore =
      opts.ignored instanceof RegExp && opts.ignored.flags === ''
        ? [opts.ignored, ...VCS_IGNORE_GLOBS]
        : VCS_IGNORE_GLOBS;

    setImmediate(() => this._start());
  }

  private _parcelOpts(): parcelWatcher.Options {
    return {backend: this._backend, ignore: this._parcelIgnore};
  }

  // close() ends with removeAllListeners(), and an 'error' emit without a
  // listener throws. Async work started before close() can still fail after
  // it (a hung subscribe finally rejecting, an in-flight lstat) — swallow
  // those instead of crashing the process.
  private _emitError(error: unknown): void {
    if (this._closed) {
      return;
    }
    this.emit('error', error);
  }

  // Parcel compiles the regex source with C++ std::regex, which rejects some
  // JS-valid constructs (lookbehind, named groups, \p{…}) at subscribe time.
  // There is no way to validate against std::regex from JS ahead of time, so
  // rejection is the signal: drop the regex (per-event filtering still happens
  // through _doIgnore) and retry with the VCS globs alone.
  private async _subscribe(): Promise<parcelWatcher.AsyncSubscription> {
    try {
      return await parcelWatcher.subscribe(
        this.root,
        this._handleEvents,
        this._parcelOpts(),
      );
    } catch (error) {
      const rejectedPattern = this._parcelIgnore.find(
        pattern => pattern instanceof RegExp,
      );
      if (rejectedPattern == null) {
        throw error;
      }
      // The retry can also swallow failures unrelated to the regex, silently
      // costing the native-level ignore for the session — make it diagnosable.
      console.warn(
        `jest-haste-map: subscribing with the ignore pattern ${rejectedPattern} failed (${error}); ignored paths will still be watched and filtered in JS`,
      );
      this._parcelIgnore = VCS_IGNORE_GLOBS;
      return parcelWatcher.subscribe(
        this.root,
        this._handleEvents,
        this._parcelOpts(),
      );
    }
  }

  private async _start(): Promise<void> {
    try {
      const subscription = await this._subscribe();

      // WatcherDriver may time out and call close() while subscribe() was in
      // flight. Unsubscribe immediately rather than leaking the subscription.
      if (this._closed) {
        await subscription.unsubscribe();
        return;
      }
      this._subscription = subscription;

      this.emit('ready');
    } catch (error) {
      this._emitError(error);
    }
  }

  private _handleEvents = (
    err: Error | null,
    events: Array<parcelWatcher.Event>,
  ) => {
    if (this._closed) {
      return;
    }
    if (err) {
      this._emitError(err);
      return;
    }

    for (const event of events) {
      const absPath = event.path;
      const relPath = path.relative(this.root, absPath);

      if (!isFileIncluded(this._glob, this._dot, this._doIgnore, relPath)) {
        continue;
      }

      if (event.type === 'delete') {
        this.emit(DELETE_EVENT, relPath, this.root);
        this.emit(ALL_EVENT, DELETE_EVENT, relPath, this.root);
      } else {
        const type = event.type === 'create' ? ADD_EVENT : CHANGE_EVENT;
        fs.lstat(absPath, (error, stat) => {
          if (error?.code === 'ENOENT') return;
          if (error) {
            this._emitError(error);
            return;
          }
          this.emit(type, relPath, this.root, stat);
          this.emit(ALL_EVENT, type, relPath, this.root, stat);
        });
      }
    }
  };

  async close(): Promise<void> {
    this._closed = true;
    await this._subscription?.unsubscribe();
    this._subscription = null;
    this.removeAllListeners();
  }
}
