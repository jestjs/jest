/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import chalk from 'chalk';
import * as fs from 'graceful-fs';
import naturalCompare from 'natural-compare';
import type {Config} from '@jest/types';
import type {SnapshotData} from './types';

export const SNAPSHOT_VERSION = '1';
const SNAPSHOT_HEADER_REGEXP = /^\/\/ Jest Snapshot v(.+), (.+)$/m;
export const SNAPSHOT_GUIDE_LINK = 'https://jestjs.io/docs/snapshot-testing';
export const SNAPSHOT_VERSION_WARNING = chalk.yellow(
  `${chalk.bold('Warning')}: Before you upgrade snapshots, ` +
    'we recommend that you revert any local changes to tests or other code, ' +
    'to ensure that you do not store invalid state.',
);

const writeSnapshotVersion = () =>
  `// Jest Snapshot v${SNAPSHOT_VERSION}, ${SNAPSHOT_GUIDE_LINK}`;

const validateSnapshotHeader = (snapshotContents: string) => {
  const headerTest = SNAPSHOT_HEADER_REGEXP.exec(snapshotContents);
  const version = headerTest && headerTest[1];
  const guideLink = headerTest && headerTest[2];

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

  if (guideLink !== SNAPSHOT_GUIDE_LINK) {
    return new Error(
      // eslint-disable-next-line prefer-template
      chalk.red(
        `${chalk.red.bold(
          'Outdated guide link',
        )}: The snapshot guide link at the top of this snapshot is outdated. ` +
          'Please update all snapshots during this upgrade of Jest.',
      ) +
        '\n\n' +
        `Expected: ${SNAPSHOT_GUIDE_LINK}\n` +
        `Received: ${guideLink}`,
    );
  }

  return null;
};

// A hint is joined onto the test name with this, so a name allowed to contain
// it would make the join unreadable — which test a key belongs to could not be
// recovered. Escaped rather than rejected, since a title is the author's.
export const HINT_SEPARATOR = ' \u203A ';
const ESCAPED_HINT_SEPARATOR = ' \\u203A ';

const normalizeTestNameForKey = (testName: string): string =>
  testName
    .replaceAll(HINT_SEPARATOR, ESCAPED_HINT_SEPARATOR)
    .replaceAll(/\r\n|\r|\n/g, match => {
      switch (match) {
        case '\r\n':
          return '\\r\\n';
        case '\r':
          return '\\r';
        case '\n':
          return '\\n';
        default:
          return match;
      }
    });

const denormalizeTestNameFromKey = (key: string): string =>
  key
    .replaceAll(/\\r\\n|\\r|\\n/g, match => {
      switch (match) {
        case '\\r\\n':
          return '\r\n';
        case '\\r':
          return '\r';
        case '\\n':
          return '\n';
        default:
          return match;
      }
    })
    .replaceAll(ESCAPED_HINT_SEPARATOR, HINT_SEPARATOR);

export type SnapshotKeyParts = {
  readonly testName: string;
  readonly hint?: string;
  readonly count: number;
  readonly nameOccurrence?: number;
};

// Tests sharing a full name would otherwise share one key space and take each
// other's keys, so every namesake after the first counts within its own. The
// separator is a dot because a name can end in anything a test author types,
// including something that looks like the occurrence.
export const testNameToKey = ({
  testName,
  hint,
  count,
  nameOccurrence,
}: SnapshotKeyParts): string => {
  const name = normalizeTestNameForKey(testName);
  const hinted =
    hint === undefined || hint.length === 0
      ? name
      : `${name}${HINT_SEPARATOR}${normalizeTestNameForKey(hint)}`;

  return nameOccurrence !== undefined && nameOccurrence > 1
    ? `${hinted} ${nameOccurrence}.${count}`
    : `${hinted} ${count}`;
};

const KEY_COUNT_SUFFIX = / \d+(\.\d+)?$/;
const KEY_OCCURRENCE_SUFFIX = / (\d+)\.\d+$/;

// Which of the tests sharing a name a key belongs to. A bare count means the
// first, which is the only one whose keys carry no position.
export const keyToNameOccurrence = (key: string): number => {
  const match = KEY_OCCURRENCE_SUFFIX.exec(key);
  return match === null ? 1 : Number(match[1]);
};

// The name a key belongs to, without the hint. The separator appears once
// unescaped, so a colon or a digit in either half cannot be mistaken for it.
export const keyToTestName = (key: string): string => {
  if (!KEY_COUNT_SUFFIX.test(key)) {
    throw new Error('Snapshot keys must end with a number.');
  }
  const withoutCount = key.replace(KEY_COUNT_SUFFIX, '');
  const separatorAt = withoutCount.indexOf(HINT_SEPARATOR);
  const testNameWithoutCount =
    separatorAt === -1 ? withoutCount : withoutCount.slice(0, separatorAt);
  return denormalizeTestNameFromKey(testNameWithoutCount);
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

  const validationResult = validateSnapshotHeader(snapshotContents);
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
