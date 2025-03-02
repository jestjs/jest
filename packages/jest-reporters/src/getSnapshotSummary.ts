/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pc from 'picocolors';
import type {SnapshotSummary} from '@jest/test-result';
import type {Config} from '@jest/types';
import {pluralize} from 'jest-util';
import formatTestPath from './formatTestPath';

const ARROW = ' \u203A ';
const DOWN_ARROW = ' \u21B3 ';
const DOT = ' \u2022 ';
const FAIL_COLOR = (str: string) => pc.bold(pc.red(str));
const OBSOLETE_COLOR = (str: string) => pc.bold(pc.yellow(str));
const SNAPSHOT_ADDED = (str: string) => pc.bold(pc.green(str));
const SNAPSHOT_NOTE = pc.dim;
const SNAPSHOT_REMOVED = (str: string) => pc.bold(pc.green(str));
const SNAPSHOT_SUMMARY = pc.bold;
const SNAPSHOT_UPDATED = (str: string) => pc.bold(pc.green(str));

export default function getSnapshotSummary(
  snapshots: SnapshotSummary,
  globalConfig: Config.GlobalConfig,
  updateCommand: string,
): Array<string> {
  const summary = [];
  summary.push(SNAPSHOT_SUMMARY('Snapshot Summary'));
  if (snapshots.added) {
    summary.push(
      `${SNAPSHOT_ADDED(
        `${ARROW + pluralize('snapshot', snapshots.added)} written `,
      )}from ${pluralize('test suite', snapshots.filesAdded)}.`,
    );
  }

  if (snapshots.unmatched) {
    summary.push(
      `${FAIL_COLOR(
        `${ARROW}${pluralize('snapshot', snapshots.unmatched)} failed`,
      )} from ${pluralize(
        'test suite',
        snapshots.filesUnmatched,
      )}. ${SNAPSHOT_NOTE(
        `Inspect your code changes or ${updateCommand} to update them.`,
      )}`,
    );
  }

  if (snapshots.updated) {
    summary.push(
      `${SNAPSHOT_UPDATED(
        `${ARROW + pluralize('snapshot', snapshots.updated)} updated `,
      )}from ${pluralize('test suite', snapshots.filesUpdated)}.`,
    );
  }

  if (snapshots.filesRemoved) {
    if (snapshots.didUpdate) {
      summary.push(
        `${SNAPSHOT_REMOVED(
          `${ARROW}${pluralize(
            'snapshot file',
            snapshots.filesRemoved,
          )} removed `,
        )}from ${pluralize('test suite', snapshots.filesRemoved)}.`,
      );
    } else {
      summary.push(
        `${OBSOLETE_COLOR(
          `${ARROW}${pluralize(
            'snapshot file',
            snapshots.filesRemoved,
          )} obsolete `,
        )}from ${pluralize(
          'test suite',
          snapshots.filesRemoved,
        )}. ${SNAPSHOT_NOTE(
          `To remove ${
            snapshots.filesRemoved === 1 ? 'it' : 'them all'
          }, ${updateCommand}.`,
        )}`,
      );
    }
  }
  if (snapshots.filesRemovedList && snapshots.filesRemovedList.length > 0) {
    const [head, ...tail] = snapshots.filesRemovedList;
    summary.push(`  ${DOWN_ARROW} ${DOT}${formatTestPath(globalConfig, head)}`);

    for (const key of tail) {
      summary.push(`      ${DOT}${formatTestPath(globalConfig, key)}`);
    }
  }

  if (snapshots.unchecked) {
    if (snapshots.didUpdate) {
      summary.push(
        `${SNAPSHOT_REMOVED(
          `${ARROW}${pluralize('snapshot', snapshots.unchecked)} removed `,
        )}from ${pluralize(
          'test suite',
          snapshots.uncheckedKeysByFile.length,
        )}.`,
      );
    } else {
      summary.push(
        `${OBSOLETE_COLOR(
          `${ARROW}${pluralize('snapshot', snapshots.unchecked)} obsolete `,
        )}from ${pluralize(
          'test suite',
          snapshots.uncheckedKeysByFile.length,
        )}. ${SNAPSHOT_NOTE(
          `To remove ${
            snapshots.unchecked === 1 ? 'it' : 'them all'
          }, ${updateCommand}.`,
        )}`,
      );
    }

    for (const uncheckedFile of snapshots.uncheckedKeysByFile) {
      summary.push(
        `  ${DOWN_ARROW}${formatTestPath(
          globalConfig,
          uncheckedFile.filePath,
        )}`,
      );

      for (const key of uncheckedFile.keys) {
        summary.push(`      ${DOT}${key}`);
      }
    }
  }

  return summary;
}
