/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

import getSnapshotSummary from '../get_snapshot_summary';

const UPDATE_COMMAND = 'press --u';

test('creates a snapshot summary', () => {
  const snapshots = {
    added: 1,
    didUpdate: false,
    filesAdded: 1,
    filesRemoved: 1,
    filesUnmatched: 1,
    filesUpdated: 1,
    matched: 2,
    total: 2,
    unchecked: 1,
    unmatched: 1,
    updated: 1,
  };

  expect(getSnapshotSummary(snapshots, UPDATE_COMMAND)).toMatchSnapshot();
});

test('creates a snapshot summary after an update', () => {
  const snapshots = {
    added: 1,
    didUpdate: true,
    filesAdded: 1,
    filesRemoved: 1,
    filesUnmatched: 1,
    filesUpdated: 1,
    unchecked: 1,
    unmatched: 1,
    updated: 1,
  };

  expect(getSnapshotSummary(snapshots, UPDATE_COMMAND)).toMatchSnapshot();
});

it('creates a snapshot summary with multiple snapshot being written/updated', () => {
  const snapshots = {
    added: 2,
    didUpdate: false,
    filesAdded: 2,
    filesRemoved: 2,
    filesUnmatched: 2,
    filesUpdated: 2,
    unchecked: 2,
    unmatched: 2,
    updated: 2,
  };

  expect(getSnapshotSummary(snapshots, UPDATE_COMMAND)).toMatchSnapshot();
});

it('returns nothing if there are no updates', () => {
  const snapshots = {
    added: 0,
    didUpdate: false,
    filesAdded: 0,
    filesRemoved: 0,
    filesUnmatched: 0,
    filesUpdated: 0,
    unchecked: 0,
    unmatched: 0,
    updated: 0,
  };
  expect(getSnapshotSummary(snapshots, UPDATE_COMMAND)).toMatchSnapshot();
});
