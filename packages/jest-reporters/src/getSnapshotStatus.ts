/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pc from 'picocolors';
import type {TestResult} from '@jest/test-result';
import {pluralize} from 'jest-util';

const ARROW = ' \u203A ';
const DOT = ' \u2022 ';
const FAIL_COLOR = (str: string) => pc.bold(pc.red(str));
const SNAPSHOT_ADDED = (str: string) => pc.bold(pc.green(str));
const SNAPSHOT_UPDATED = (str: string) => pc.bold(pc.green(str));
const SNAPSHOT_OUTDATED = (str: string) => pc.bold(pc.yellow(str));

export default function getSnapshotStatus(
  snapshot: TestResult['snapshot'],
  afterUpdate: boolean,
): Array<string> {
  const statuses = [];

  if (snapshot.added) {
    statuses.push(
      SNAPSHOT_ADDED(
        `${ARROW + pluralize('snapshot', snapshot.added)} written.`,
      ),
    );
  }

  if (snapshot.updated) {
    statuses.push(
      SNAPSHOT_UPDATED(
        `${ARROW + pluralize('snapshot', snapshot.updated)} updated.`,
      ),
    );
  }

  if (snapshot.unmatched) {
    statuses.push(
      FAIL_COLOR(
        `${ARROW + pluralize('snapshot', snapshot.unmatched)} failed.`,
      ),
    );
  }

  if (snapshot.unchecked) {
    if (afterUpdate) {
      statuses.push(
        SNAPSHOT_UPDATED(
          `${ARROW + pluralize('snapshot', snapshot.unchecked)} removed.`,
        ),
      );
    } else {
      statuses.push(
        `${SNAPSHOT_OUTDATED(
          `${ARROW + pluralize('snapshot', snapshot.unchecked)} obsolete`,
        )}.`,
      );
    }

    for (const key of snapshot.uncheckedKeys) {
      statuses.push(`  ${DOT}${key}`);
    }
  }

  if (snapshot.fileDeleted) {
    statuses.push(SNAPSHOT_UPDATED(`${ARROW}snapshot file removed.`));
  }

  return statuses;
}
