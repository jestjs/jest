/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Path, SnapshotUpdateState} from 'types/Config';

import {getSerializers} from './plugins';
import chalk from 'chalk';
import fs from 'fs';
import mkdirp from 'mkdirp';
import naturalCompare from 'natural-compare';
import path from 'path';
import prettyFormat from 'pretty-format';

export const SNAPSHOT_EXTENSION = 'snap';
export const SNAPSHOT_VERSION = '1';
const SNAPSHOT_VERSION_REGEXP = /^\/\/ Jest Snapshot v(.+),/;
export const SNAPSHOT_GUIDE_LINK =
  'http://facebook.github.io/jest/docs/en/snapshot-testing.html';
export const SNAPSHOT_VERSION_WARNING = chalk.yellow(
  `${chalk.bold('Warning')}: Before you upgrade snapshots, ` +
    `we recommend that you revert any local changes to tests or other code, ` +
    `to ensure that you do not store invalid state.`,
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
          `Jest 19 introduced versioned snapshots to ensure all developers ` +
          `on a project are using the same version of Jest. ` +
          `Please update all snapshots during this upgrade of Jest.\n\n`,
      ) + SNAPSHOT_VERSION_WARNING,
    );
  }

  if (version < SNAPSHOT_VERSION) {
    return new Error(
      chalk.red(
        `${chalk.red.bold('Outdated snapshot')}: The version of the snapshot ` +
          `file associated with this test is outdated. The snapshot file ` +
          `version ensures that all developers on a project are using ` +
          `the same version of Jest. ` +
          `Please update all snapshots during this upgrade of Jest.\n\n`,
      ) +
        `Expected: v${SNAPSHOT_VERSION}\n` +
        `Received: v${version}\n\n` +
        SNAPSHOT_VERSION_WARNING,
    );
  }

  if (version > SNAPSHOT_VERSION) {
    return new Error(
      chalk.red(
        `${chalk.red.bold('Outdated Jest version')}: The version of this ` +
          `snapshot file indicates that this project is meant to be used ` +
          `with a newer version of Jest. The snapshot file version ensures ` +
          `that all developers on a project are using the same version of ` +
          `Jest. Please update your version of Jest and re-run the tests.\n\n`,
      ) +
        `Expected: v${SNAPSHOT_VERSION}\n` +
        `Received: v${version}`,
    );
  }

  return null;
};

export const testNameToKey = (testName: string, count: number) =>
  testName + ' ' + count;

export const keyToTestName = (key: string) => {
  if (!/ \d+$/.test(key)) {
    throw new Error('Snapshot keys must end with a number.');
  }

  return key.replace(/ \d+$/, '');
};

export const getSnapshotPath = (testPath: Path) =>
  path.join(
    path.join(path.dirname(testPath), '__snapshots__'),
    path.basename(testPath) + '.' + SNAPSHOT_EXTENSION,
  );

export const getSnapshotData = (
  snapshotPath: Path,
  update: SnapshotUpdateState,
) => {
  const data = Object.create(null);
  let snapshotContents = '';
  let dirty = false;

  if (fs.existsSync(snapshotPath)) {
    try {
      snapshotContents = fs.readFileSync(snapshotPath, 'utf8');
      // eslint-disable-next-line no-new-func
      const populate = new Function('exports', snapshotContents);
      // $FlowFixMe
      populate(data);
    } catch (e) {}
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

// Extra line breaks at the beginning and at the end of the snapshot are useful
// to make the content of the snapshot easier to read
const addExtraLineBreaks = string =>
  string.includes('\n') ? `\n${string}\n` : string;

export const serialize = (data: any): string => {
  return addExtraLineBreaks(
    normalizeNewlines(
      prettyFormat(data, {
        escapeRegex: true,
        plugins: getSerializers(),
        printFunctionName: false,
      }),
    ),
  );
};

// unescape double quotes
export const unescape = (data: any): string => data.replace(/\\(")/g, '$1');

const printBacktickString = (str: string) => {
  return '`' + str.replace(/`|\\|\${/g, '\\$&') + '`';
};

export const ensureDirectoryExists = (filePath: Path) => {
  try {
    mkdirp.sync(path.join(path.dirname(filePath)), '777');
  } catch (e) {}
};

const normalizeNewlines = string => string.replace(/\r\n|\r/g, '\n');

export const saveSnapshotFile = (
  snapshotData: {[key: string]: string},
  snapshotPath: Path,
) => {
  const snapshots = Object.keys(snapshotData)
    .sort(naturalCompare)
    .map(
      key =>
        'exports[' +
        printBacktickString(key) +
        '] = ' +
        printBacktickString(normalizeNewlines(snapshotData[key])) +
        ';',
    );

  ensureDirectoryExists(snapshotPath);
  fs.writeFileSync(
    snapshotPath,
    writeSnapshotVersion() + '\n\n' + snapshots.join('\n\n') + '\n',
  );
};
