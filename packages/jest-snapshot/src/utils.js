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

import type {Path} from 'types/Config';

const createDirectory = require('jest-util').createDirectory;
const fileExists = require('jest-file-exists');
const path = require('path');
const prettyFormat = require('pretty-format');
const fs = require('fs');
const naturalCompare = require('natural-compare');
const getSerializers = require('./plugins').getSerializers;

const SNAPSHOT_EXTENSION = 'snap';
const SNAPSHOT_VERSION = '1';
const SNAPSHOT_VERSION_REGEXP = /^\/\/ Jest Snapshot v(.+),/;
const SNAPSHOT_GUIDE_LINK = 'https://goo.gl/fbAQLP';

const writeSnapshotVersion = () =>
  `// Jest Snapshot v${SNAPSHOT_VERSION}, ${SNAPSHOT_GUIDE_LINK}`;

const validateSnapshotVersion = (snapshotContents: string) => {
  const versionTest = SNAPSHOT_VERSION_REGEXP.exec(snapshotContents);
  const version = versionTest && versionTest[1] || '0';

  if (version < SNAPSHOT_VERSION) {
    throw new Error(
      `Stored snapshot version is outdated.\n` +
      `Expected: v${SNAPSHOT_VERSION}, but received: v${version}\n` +
      `Update the snapshot to remove this error.`
    );
  }
};

const testNameToKey = (testName: string, count: number) =>
  testName + ' ' + count;

const keyToTestName = (key: string) => {
  if (!/ \d+$/.test(key)) {
    throw new Error('Snapshot keys must end with a number.');
  }

  return key.replace(/ \d+$/, '');
};

const getSnapshotPath = (testPath: Path) => path.join(
  path.join(path.dirname(testPath), '__snapshots__'),
  path.basename(testPath) + '.' + SNAPSHOT_EXTENSION,
);

const getSnapshotData = (snapshotPath: Path, update: boolean) => {
  const data = Object.create(null);
  let snapshotContents;

  if (fileExists(snapshotPath)) {
    try {
      snapshotContents = fs.readFileSync(snapshotPath, 'utf8');
      // eslint-disable-next-line no-new-func
      const populate = new Function('exports', snapshotContents);
      populate(data);
    } catch (e) {}
  }

  if (!update && snapshotContents) {
    validateSnapshotVersion(snapshotContents);
  }
  return data;
};

// Extra line breaks at the beginning and at the end of the snapshot are useful
// to make the content of the snapshot easier to read
const addExtraLineBreaks =
  string => string.includes('\n') ? `\n${string}\n` : string;

const serialize = (data: any): string => {
  return addExtraLineBreaks(prettyFormat(data, {
    escapeRegex: true,
    plugins: getSerializers(),
    printFunctionName: false,
  }));
};

const unescape = (data: any): string =>
  data.replace(/\\(")/g, '$1'); // unescape double quotes

const printBacktickString = (str: string) => {
  return '`' + str.replace(/`|\\|\${/g, '\\$&') + '`';
};

const ensureDirectoryExists = (filePath: Path) => {
  try {
    createDirectory(path.join(path.dirname(filePath)));
  } catch (e) {}
};

const normalizeNewlines =
  string => string.replace(/\r\n|\r/g, '\n');

const saveSnapshotFile = (
  snapshotData: {[key: string]: string},
  snapshotPath: Path,
) => {
  const snapshots = Object.keys(snapshotData).sort(naturalCompare)
    .map(key =>
      'exports[' + printBacktickString(key) + '] = ' +
      printBacktickString(normalizeNewlines(snapshotData[key])) + ';',
    );

  ensureDirectoryExists(snapshotPath);
  fs.writeFileSync(
    snapshotPath,
    writeSnapshotVersion() + '\n\n' + snapshots.join('\n\n') + '\n'
  );
};

module.exports = {
  SNAPSHOT_EXTENSION,
  SNAPSHOT_GUIDE_LINK,
  SNAPSHOT_VERSION,
  ensureDirectoryExists,
  getSnapshotData,
  getSnapshotPath,
  keyToTestName,
  saveSnapshotFile,
  serialize,
  testNameToKey,
  unescape,
};
