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
  currentSpecName: string,
  getCounter: (() => number),
  incrementCounter: (() => number),
  snapshot: SnapshotFileT,
  added: number,
  updated: number,
  matched: number,
  unmatched: number,
};
