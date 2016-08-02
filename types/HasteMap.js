/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type _HasteMapInstance from '../packages/jest-haste-map/src';
import type HasteResolver from '../packages/jest-resolve/src';

export type HasteMapInstance = _HasteMapInstance;

export type HasteContext = {
  instance: HasteMapInstance,
  moduleMap: HasteMap,
  resolver: HasteResolver,
};

export type HasteMap = FileMap & ModuleMap;

export type FileMap = {
  clocks: WatchmanClocks,
  files: {[filepath: string]: FileMetaData},
};

export type ModuleMap = {
  map: {[id: string]: ModuleMapItem},
  mocks: {[id: string]: string},
}

type WatchmanClocks = {[filepath: string]: string};

export type FileMetaData = [
  /* id */ string,
  /* mtime */ number,
  /* visited */ 0|1,
  /* dependencies */ Array<string>,
];

type ModuleMapItem = {[platform: string]: ModuleMetaData};
export type ModuleMetaData = [
  /* path */ string,
  /* type */ number,
];

export type HType = {
  ID: 0,
  MTIME: 1,
  VISITED: 2,
  DEPENDENCIES: 3,
  PATH: 0,
  TYPE: 1,
  MODULE: 0,
  PACKAGE: 1,
  GENERIC_PLATFORM: 'g',
};

export type HTypeValue = 0 | 1 | 2 | 3 | 'g';
