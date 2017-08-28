/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const getSnapshotStatus = require('../get_snapshot_status');

test('Retrieves the snapshot status', () => {
  const snapshotResult = {
    added: 1,
    fileDeleted: false,
    matched: 1,
    unchecked: 1,
    unmatched: 1,
    updated: 1,
  };

  expect(getSnapshotStatus(snapshotResult, false)).toMatchSnapshot();
});

test('Shows no snapshot updates if all snapshots matched', () => {
  const snapshotResult = {
    added: 0,
    fileDeleted: false,
    matched: 1,
    unchecked: 0,
    unmatched: 0,
    updated: 0,
  };

  expect(getSnapshotStatus(snapshotResult, true)).toMatchSnapshot();
});

test('Retrieves the snapshot status after a snapshot update', () => {
  const snapshotResult = {
    added: 2,
    fileDeleted: true,
    matched: 2,
    unchecked: 2,
    unmatched: 2,
    updated: 2,
  };

  expect(getSnapshotStatus(snapshotResult, true)).toMatchSnapshot();
});
