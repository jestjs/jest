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
import type {Path} from 'types/Config';

const SnapshotFile = require('./SnapshotFile');

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

module.exports = {
  createSnapshotState(filePath: Path): SnapshotState {
    let _index = 0;
    let _name = '';

    /* $FlowFixMe */
    return Object.assign(Object.create(null), {
      getCounter: () => _index,
      getSpecName: () => _name,
      incrementCounter: () => ++_index,
      setCounter(index) {
        _index = index;
      },
      setSpecName(name) {
        _name = name;
      },
      snapshot: SnapshotFile.forFile(filePath),
      added: 0,
      updated: 0,
      matched: 0,
      unmatched: 0,
    });
  },
};
