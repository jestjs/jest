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

import type {SnapshotFileT} from './SnapshotFile';

export type SnapshotState = {
  added: number,
  getSpecName(): string,
  getCounter(): number,
  incrementCounter(): number,
  matched: number,
  setCounter(index: number): void,
  setSpecName(name: string): void,
  snapshot: SnapshotFileT,
  unmatched: number,
  updated: number,
};
