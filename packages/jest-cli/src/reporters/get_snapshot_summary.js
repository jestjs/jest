/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {SnapshotSummary} from 'types/TestResult';

import chalk from 'chalk';
import {pluralize} from './utils';

const ARROW = ' \u203A ';
const FAIL_COLOR = chalk.bold.red;
const SNAPSHOT_ADDED = chalk.bold.green;
const SNAPSHOT_NOTE = chalk.dim;
const SNAPSHOT_REMOVED = chalk.bold.red;
const SNAPSHOT_SUMMARY = chalk.bold;
const SNAPSHOT_UPDATED = chalk.bold.green;

module.exports = (
  snapshots: SnapshotSummary,
  updateCommand: string,
): Array<string> => {
  const summary = [];
  summary.push(SNAPSHOT_SUMMARY('Snapshot Summary'));
  if (snapshots.added) {
    summary.push(
      SNAPSHOT_ADDED(ARROW + pluralize('snapshot', snapshots.added)) +
        ` written in ${pluralize('test suite', snapshots.filesAdded)}.`,
    );
  }

  if (snapshots.unmatched) {
    summary.push(
      FAIL_COLOR(ARROW + pluralize('snapshot test', snapshots.unmatched)) +
        ` failed in ` +
        `${pluralize('test suite', snapshots.filesUnmatched)}. ` +
        SNAPSHOT_NOTE(
          'Inspect your code changes or ' + updateCommand + ' to update them.',
        ),
    );
  }

  if (snapshots.updated) {
    summary.push(
      SNAPSHOT_UPDATED(ARROW + pluralize('snapshot', snapshots.updated)) +
        ` updated in ${pluralize('test suite', snapshots.filesUpdated)}.`,
    );
  }

  if (snapshots.filesRemoved) {
    summary.push(
      SNAPSHOT_REMOVED(
        ARROW + pluralize('obsolete snapshot file', snapshots.filesRemoved),
      ) +
        (snapshots.didUpdate
          ? ' removed.'
          : ' found, ' +
            updateCommand +
            ' to remove ' +
            (snapshots.filesRemoved === 1 ? 'it' : 'them.') +
            '.'),
    );
  }

  if (snapshots.unchecked) {
    summary.push(
      FAIL_COLOR(ARROW + pluralize('obsolete snapshot', snapshots.unchecked)) +
        (snapshots.didUpdate
          ? ' removed.'
          : ' found, ' +
            updateCommand +
            ' to remove ' +
            (snapshots.filesRemoved === 1 ? 'it' : 'them') +
            '.'),
    );
  }

  return summary;
};
