/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {ModuleMap as _ModuleMap, FS} from 'jest-haste-map';
import type {Path} from 'types/Config';
import type HasteResolver from 'jest-resolve';

export type HasteFS = FS;
export type ModuleMap = _ModuleMap;

export type FileData = {[filepath: Path]: FileMetaData};
export type MockData = {[id: string]: Path};
export type ModuleMapData = {[id: string]: ModuleMapItem};
export type WatchmanClocks = {[filepath: Path]: string};
export type HasteRegExp = RegExp | ((str: string) => boolean);

export type DuplicatesSet = {[filePath: string]: /* type */ number};
export type DuplicatesIndex = {
  [id: string]: {[platform: string]: DuplicatesSet},
};

export type InternalHasteMap = {|
  clocks: WatchmanClocks,
  duplicates: DuplicatesIndex,
  files: FileData,
  map: ModuleMapData,
  mocks: MockData,
|};

export type HasteMap = {|
  hasteFS: HasteFS,
  moduleMap: ModuleMap,
  __hasteMapForTest?: ?InternalHasteMap,
|};

export type RawModuleMap = {|
  duplicates: DuplicatesIndex,
  map: ModuleMapData,
  mocks: MockData,
|};

// prettier-ignore
export type FileMetaData = [
  /* id */ string,
  /* mtime */ number,
  /* visited */ 0 | 1,
  /* dependencies */ Array<string>,
];

type ModuleMapItem = {[platform: string]: ModuleMetaData};
export type ModuleMetaData = [Path, /* type */ number];

export type HType = {|
  ID: 0,
  MTIME: 1,
  VISITED: 2,
  DEPENDENCIES: 3,
  PATH: 0,
  TYPE: 1,
  MODULE: 0,
  PACKAGE: 1,
  GENERIC_PLATFORM: 'g',
  NATIVE_PLATFORM: 'native',
|};

export type HTypeValue = 0 | 1 | 2 | 3 | 'g';
