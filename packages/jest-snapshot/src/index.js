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

import type {HasteFS} from 'types/HasteMap';
import type {Path} from 'types/Config';

const diff = require('jest-diff');
const fs = require('fs');
const path = require('path');
const SnapshotState = require('./State');
const {addSerializer, getSerializers} = require('./plugins');

const {
  EXPECTED_COLOR,
  ensureNoExpected,
  matcherHint,
  RECEIVED_COLOR,
} = require('jest-matcher-utils');
const {SNAPSHOT_EXTENSION} = require('./utils');

const fileExists = (filePath: Path, hasteFS: HasteFS): boolean =>
  hasteFS.exists(filePath) || fs.existsSync(filePath);

const cleanup = (hasteFS: HasteFS, update: boolean) => {
  const pattern = '\\.' + SNAPSHOT_EXTENSION + '$';
  const files = hasteFS.matchFiles(pattern);
  const filesRemoved = files
    .filter(
      snapshotFile =>
        !fileExists(
          path.resolve(
            path.dirname(snapshotFile),
            '..',
            path.basename(snapshotFile, '.' + SNAPSHOT_EXTENSION),
          ),
          hasteFS,
        ),
    )
    .map(snapshotFile => {
      if (update) {
        fs.unlinkSync(snapshotFile);
      }
    }).length;

  return {
    filesRemoved,
  };
};

const initializeSnapshotState = (
  testFile: Path,
  update: boolean,
  testPath: string,
  expand: boolean,
) => new SnapshotState(testFile, update, testPath, expand);

const toMatchSnapshot = function(received: any, testName?: string) {
  this.dontThrow && this.dontThrow();

  const {
    currentTestName,
    isNot,
    snapshotState,
  }: {
    currentTestName: string,
    isNot: boolean,
    snapshotState: SnapshotState,
  } = this;

  if (isNot) {
    throw new Error('Jest: `.not` cannot be used with `.toMatchSnapshot()`.');
  }

  if (!snapshotState) {
    throw new Error('Jest: snapshot state must be initialized.');
  }

  const {actual, expected, count, pass} = snapshotState.match(
    testName || currentTestName,
    received,
  );

  if (pass) {
    return {message: '', pass: true};
  } else {
    const expectedString = expected.trim();
    const actualString = actual.trim();
    const diffMessage = diff(expectedString, actualString, {
      aAnnotation: 'Snapshot',
      bAnnotation: 'Received',
      expand: snapshotState.expand,
    });

    const report = () =>
      `${RECEIVED_COLOR('Received value')} does not match ` +
      `${EXPECTED_COLOR('stored snapshot ' + count)}.\n\n` +
      (diffMessage ||
        RECEIVED_COLOR('- ' + expectedString) +
          '\n' +
          EXPECTED_COLOR('+ ' + actualString));

    const message = () =>
      matcherHint('.toMatchSnapshot', 'value', '') + '\n\n' + report();

    // Passing the the actual and expected objects so that a custom reporter
    // could access them, for example in order to display a custom visual diff,
    // or create a different error message
    return {
      actual: actualString,
      expected: expectedString,
      message,
      name: 'toMatchSnapshot',
      pass: false,
      report,
    };
  }
};

const toThrowErrorMatchingSnapshot = function(received: any, expected: void) {
  this.dontThrow && this.dontThrow();
  const {isNot} = this;

  if (isNot) {
    throw new Error(
      'Jest: `.not` cannot be used with `.toThrowErrorMatchingSnapshot()`.',
    );
  }

  ensureNoExpected(expected, '.toThrowErrorMatchingSnapshot');

  let error;

  try {
    received();
  } catch (e) {
    error = e;
  }

  if (error === undefined) {
    throw new Error(
      matcherHint('.toThrowErrorMatchingSnapshot', '() => {}', '') +
        '\n\n' +
        `Expected the function to throw an error.\n` +
        `But it didn't throw anything.`,
    );
  }

  return toMatchSnapshot.call(this, error.message);
};

module.exports = {
  EXTENSION: SNAPSHOT_EXTENSION,
  SnapshotState,
  addSerializer,
  cleanup,
  getSerializers,
  initializeSnapshotState,
  toMatchSnapshot,
  toThrowErrorMatchingSnapshot,
};
