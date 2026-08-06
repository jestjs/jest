/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import type {Stats} from 'graceful-fs';
import {invariant} from 'jest-util';
import HasteFS from '../HasteFS';
import HasteModuleMap from '../ModuleMap';
import H from '../constants';
import getMockName from '../getMockName';
import * as fastPath from '../lib/fast_path';
import getPlatformExtension from '../lib/getPlatformExtension';
import normalizePathSep from '../lib/normalizePathSep';
import {copy} from '../lib/util';
import type {
  ChangeEvent,
  EventsQueue,
  FileMetaData,
  InternalHasteMap,
} from '../types';

const CHANGE_INTERVAL = 30;

export type Callbacks = {
  cleanup: () => void;
  emit: (event: ChangeEvent) => void;
  ignore: (filePath: string) => boolean;
  mocksPattern: RegExp | null;
  onError: (error: Error) => void;
  platforms: Array<string>;
  processFile: (
    hasteMap: InternalHasteMap,
    filePath: string,
  ) => Promise<void> | null;
  recoverDuplicates: (
    hasteMap: InternalHasteMap,
    relativeFilePath: string,
    moduleName: string,
  ) => void;
  rootDir: string;
};

export class ChangeQueue {
  private readonly _callbacks: Callbacks;
  private readonly _extensions: Array<string>;
  private _changeInterval?: ReturnType<typeof setInterval>;
  private _changeQueue: Promise<null | void> = Promise.resolve();
  private _eventsQueue: EventsQueue = [];
  private _pendingEventKeys = new Set<string>();
  private _hasteMap: InternalHasteMap;
  // We only need to copy the entire haste map once per "frame".
  private _mustCopy = true;

  constructor(
    hasteMap: InternalHasteMap,
    extensions: Array<string>,
    callbacks: Callbacks,
  ) {
    this._hasteMap = hasteMap;
    this._extensions = extensions;
    this._callbacks = callbacks;
  }

  start(): void {
    this._changeInterval = setInterval(
      () => this._emitChange(),
      CHANGE_INTERVAL,
    );
  }

  stop(): void {
    if (this._changeInterval) {
      clearInterval(this._changeInterval);
    }
  }

  onChange(type: string, filePath: string, root: string, stat?: Stats): void {
    const {ignore, rootDir} = this._callbacks;

    filePath = path.join(root, normalizePathSep(filePath));
    if (
      (stat && stat.isDirectory()) ||
      ignore(filePath) ||
      !this._extensions.some(ext => filePath.endsWith(ext))
    ) {
      return;
    }

    const relativeFilePath = fastPath.relative(rootDir, filePath);
    const fileMetadata = this._hasteMap.files.get(relativeFilePath);

    // The file has been accessed, not modified.
    if (
      type === 'change' &&
      fileMetadata &&
      stat &&
      fileMetadata[H.MTIME] === stat.mtime.getTime()
    ) {
      return;
    }

    this._changeQueue = this._changeQueue
      .then(() => {
        const dedupKey = `${type}:${filePath}:${
          stat ? stat.mtime.getTime() : ''
        }`;
        if (this._pendingEventKeys.has(dedupKey)) {
          return null;
        }

        if (this._mustCopy) {
          this._mustCopy = false;
          this._hasteMap = {
            clocks: new Map(this._hasteMap.clocks),
            duplicates: new Map(this._hasteMap.duplicates),
            files: new Map(this._hasteMap.files),
            map: new Map(this._hasteMap.map),
            mocks: new Map(this._hasteMap.mocks),
          };
        }

        const add = () => {
          this._pendingEventKeys.add(dedupKey);
          this._eventsQueue.push({filePath, stat, type});
          return null;
        };

        const currentMetadata = this._hasteMap.files.get(relativeFilePath);

        // If it's not an addition, delete the file and all its metadata.
        if (currentMetadata != null) {
          const moduleName = currentMetadata[H.ID];
          const platform =
            getPlatformExtension(filePath, this._callbacks.platforms) ||
            H.GENERIC_PLATFORM;
          this._hasteMap.files.delete(relativeFilePath);

          let moduleMap = this._hasteMap.map.get(moduleName);
          if (moduleMap != null) {
            // We are forced to copy the object because jest-haste-map
            // exposes the map as an immutable entity.
            moduleMap = copy(moduleMap);
            delete moduleMap[platform];
            if (Object.keys(moduleMap).length === 0) {
              this._hasteMap.map.delete(moduleName);
            } else {
              this._hasteMap.map.set(moduleName, moduleMap);
            }
          }

          if (
            this._callbacks.mocksPattern &&
            this._callbacks.mocksPattern.test(filePath)
          ) {
            const mockName = getMockName(filePath);
            this._hasteMap.mocks.delete(mockName);
          }

          this._callbacks.recoverDuplicates(
            this._hasteMap,
            relativeFilePath,
            moduleName,
          );
        }

        // If the file was added or changed, parse it and update the haste map.
        if (type === 'add' || type === 'change') {
          invariant(
            stat,
            'since the file exists or changed, it should have stats',
          );
          const newMetadata: FileMetaData = [
            '',
            stat.mtime.getTime(),
            stat.size,
            0,
            '',
            null,
          ];
          this._hasteMap.files.set(relativeFilePath, newMetadata);
          const promise = this._callbacks.processFile(this._hasteMap, filePath);
          this._callbacks.cleanup();
          if (promise) {
            return promise.then(add);
          } else {
            // If a file in node_modules has changed, emit an event regardless.
            add();
          }
        } else {
          add();
        }
        return null;
      })
      .catch((error: Error) => {
        this._callbacks.onError(error);
      });
  }

  private _emitChange(): void {
    if (this._eventsQueue.length > 0) {
      this._mustCopy = true;
      this._pendingEventKeys.clear();
      const {emit, rootDir} = this._callbacks;
      const changeEvent: ChangeEvent = {
        eventsQueue: this._eventsQueue,
        hasteFS: new HasteFS({files: this._hasteMap.files, rootDir}),
        moduleMap: new HasteModuleMap({
          duplicates: this._hasteMap.duplicates,
          map: this._hasteMap.map,
          mocks: this._hasteMap.mocks,
          rootDir,
        }),
      };
      emit(changeEvent);
      this._eventsQueue = [];
    }
  }
}
