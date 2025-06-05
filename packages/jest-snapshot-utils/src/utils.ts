/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import chalk from 'chalk';
import * as fs from 'graceful-fs';
import naturalCompare from 'natural-compare';
import type {Config} from '@jest/types';
import type {SnapshotData} from './types';

export const SNAPSHOT_VERSION = '1';
const SNAPSHOT_VERSION_REGEXP = /^\/\/ Jest Snapshot v(.+),/;
export const SNAPSHOT_GUIDE_LINK = 'https://jestjs.io/docs/snapshot-testing';
export const SNAPSHOT_VERSION_WARNING = chalk.yellow(
  `${chalk.bold('Warning')}: Before you upgrade snapshots, ` +
    'we recommend that you revert any local changes to tests or other code, ' +
    'to ensure that you do not store invalid state.',
);

const writeSnapshotVersion = () =>
  `// Jest Snapshot v${SNAPSHOT_VERSION}, ${SNAPSHOT_GUIDE_LINK}`;

const validateSnapshotVersion = (snapshotContents: string) => {
  const versionTest = SNAPSHOT_VERSION_REGEXP.exec(snapshotContents);
  const version = versionTest && versionTest[1];

  if (!version) {
    return new Error(
      chalk.red(
        `${chalk.bold('Outdated snapshot')}: No snapshot header found. ` +
          'Jest 19 introduced versioned snapshots to ensure all developers ' +
          'on a project are using the same version of Jest. ' +
          'Please update all snapshots during this upgrade of Jest.\n\n',
      ) + SNAPSHOT_VERSION_WARNING,
    );
  }

  if (version < SNAPSHOT_VERSION) {
    return new Error(
      // eslint-disable-next-line prefer-template
      chalk.red(
        `${chalk.red.bold('Outdated snapshot')}: The version of the snapshot ` +
          'file associated with this test is outdated. The snapshot file ' +
          'version ensures that all developers on a project are using ' +
          'the same version of Jest. ' +
          'Please update all snapshots during this upgrade of Jest.',
      ) +
        '\n\n' +
        `Expected: v${SNAPSHOT_VERSION}\n` +
        `Received: v${version}\n\n` +
        SNAPSHOT_VERSION_WARNING,
    );
  }

  if (version > SNAPSHOT_VERSION) {
    return new Error(
      // eslint-disable-next-line prefer-template
      chalk.red(
        `${chalk.red.bold('Outdated Jest version')}: The version of this ` +
          'snapshot file indicates that this project is meant to be used ' +
          'with a newer version of Jest. The snapshot file version ensures ' +
          'that all developers on a project are using the same version of ' +
          'Jest. Please update your version of Jest and re-run the tests.',
      ) +
        '\n\n' +
        `Expected: v${SNAPSHOT_VERSION}\n` +
        `Received: v${version}`,
    );
  }

  return null;
};

export const testNameToKey = (testName: string, count: number): string =>
  `${testName} ${count}`;

export const keyToTestName = (key: string): string => {
  if (!/ \d+$/.test(key)) {
    throw new Error('Snapshot keys must end with a number.');
  }

  return key.replace(/ \d+$/, '');
};

export const getSnapshotData = (
  snapshotPath: string,
  update: Config.SnapshotUpdateState,
): {
  data: SnapshotData;
  dirty: boolean;
} => {
  const data = Object.create(null);
  let snapshotContents = '';
  let dirty = false;

  if (fs.existsSync(snapshotPath)) {
    try {
      snapshotContents = fs.readFileSync(snapshotPath, 'utf8');
      // eslint-disable-next-line no-new-func
      const populate = new Function('exports', snapshotContents);
      populate(data);
    } catch {}
  }

  const validationResult = validateSnapshotVersion(snapshotContents);
  const isInvalid = snapshotContents && validationResult;

  if (update === 'none' && isInvalid) {
    throw validationResult;
  }

  if ((update === 'all' || update === 'new') && isInvalid) {
    dirty = true;
  }

  return {data, dirty};
};

export const escapeBacktickString = (str: string): string =>
  str.replaceAll(/`|\\|\${/g, '\\$&');

const printBacktickString = (str: string): string =>
  `\`${escapeBacktickString(str)}\``;

export const ensureDirectoryExists = (filePath: string): void => {
  try {
    fs.mkdirSync(path.dirname(filePath), {recursive: true});
  } catch {}
};

export const normalizeNewlines = (string: string): string =>
  string.replaceAll(/\r\n|\r/g, '\n');

export const saveSnapshotFile = (
  snapshotData: SnapshotData,
  snapshotPath: string,
): void => {
  const snapshots = Object.keys(snapshotData)
    .sort(naturalCompare)
    .map(
      key =>
        `exports[${printBacktickString(key)}] = ${printBacktickString(
          normalizeNewlines(snapshotData[key]),
        )};`,
    );

  ensureDirectoryExists(snapshotPath);
  fs.writeFileSync(
    snapshotPath,
    `${writeSnapshotVersion()}\n\n${snapshots.join('\n\n')}\n`,
  );
};
