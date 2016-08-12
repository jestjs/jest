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

import type {SnapshotState} from './SnapshotState';

type ProcessSnapshotResult = {
  pass: boolean,
  expected?: any,
};

module.exports = function processSnapshot(
  snapshotState: SnapshotState,
  key: string,
  actual: any,
  options: Object,
): ProcessSnapshotResult {
  const snapshot = snapshotState.snapshot;
  const hasSnapshot = snapshot.has(key);
  let pass = false;
  let matches;

  if (
    !snapshot.fileExists() ||
    (hasSnapshot && options.updateSnapshot) ||
    !hasSnapshot
  ) {
    if (options.updateSnapshot) {
      if (!snapshot.matches(key, actual).pass) {
        if (hasSnapshot) {
          snapshotState.updated++;
        } else {
          snapshotState.added++;
        }
        snapshot.add(key, actual);
      } else {
        snapshotState.matched++;
      }
    } else {
      snapshot.add(key, actual);
      snapshotState.added++;
    }
    pass = true;
  } else {
    matches = snapshot.matches(key, actual);
    pass = matches.pass;
    if (!pass) {
      snapshotState.unmatched++;
    } else {
      snapshotState.matched++;
    }
  }

  return {
    pass,
    expected: matches && matches.expected,
  };
};
