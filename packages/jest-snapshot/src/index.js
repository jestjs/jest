/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HasteFS} from 'types/HasteMap';
import type {MatcherState} from 'types/Matchers';
import type {Path, SnapshotUpdateState} from 'types/Config';

import fs from 'fs';
import path from 'path';
import diff from 'jest-diff';
import {EXPECTED_COLOR, matcherHint, RECEIVED_COLOR} from 'jest-matcher-utils';
import SnapshotState from './State';
import {addSerializer, getSerializers} from './plugins';
import * as utils from './utils';

const fileExists = (filePath: Path, hasteFS: HasteFS): boolean =>
  hasteFS.exists(filePath) || fs.existsSync(filePath);

const cleanup = (hasteFS: HasteFS, update: SnapshotUpdateState) => {
  const pattern = '\\.' + utils.SNAPSHOT_EXTENSION + '$';
  const files = hasteFS.matchFiles(pattern);
  const filesRemoved = files
    .filter(
      snapshotFile =>
        !fileExists(
          path.resolve(
            path.dirname(snapshotFile),
            '..',
            path.basename(snapshotFile, '.' + utils.SNAPSHOT_EXTENSION),
          ),
          hasteFS,
        ),
    )
    .map(snapshotFile => {
      if (update === 'all') {
        fs.unlinkSync(snapshotFile);
      }
    }).length;

  return {
    filesRemoved,
  };
};

const toMatchSnapshot = function(received: any, testName?: string) {
  this.dontThrow && this.dontThrow();

  const {currentTestName, isNot, snapshotState}: MatcherState = this;

  if (isNot) {
    throw new Error('Jest: `.not` cannot be used with `.toMatchSnapshot()`.');
  }

  if (!snapshotState) {
    throw new Error('Jest: snapshot state must be initialized.');
  }

  const result = snapshotState.match(
    testName && currentTestName
      ? `${currentTestName}: ${testName}`
      : currentTestName || '',
    received,
  );

  const {count, pass} = result;
  let {actual, expected} = result;

  let report;
  if (pass) {
    return {message: '', pass: true};
  } else if (!expected) {
    report = () =>
      `New snapshot was ${RECEIVED_COLOR('not written')}. The update flag ` +
      `must be explicitly passed to write a new snapshot.\n\n` +
      `This is likely because this test is run in a continuous integration ` +
      `(CI) environment in which snapshots are not written by default.\n\n` +
      `${RECEIVED_COLOR('Received value')}` +
      `${actual}`;
  } else {
    expected = (expected || '').trim();
    actual = (actual || '').trim();
    const diffMessage = diff(expected, actual, {
      aAnnotation: 'Snapshot',
      bAnnotation: 'Received',
      expand: snapshotState.expand,
    });

    report = () =>
      `${RECEIVED_COLOR('Received value')} does not match ` +
      `${EXPECTED_COLOR('stored snapshot ' + count)}.\n\n` +
      (diffMessage ||
        EXPECTED_COLOR('- ' + (expected || '')) +
          '\n' +
          RECEIVED_COLOR('+ ' + actual));
  }
  // Passing the the actual and expected objects so that a custom reporter
  // could access them, for example in order to display a custom visual diff,
  // or create a different error message
  return {
    actual,
    expected,
    message: () =>
      matcherHint('.toMatchSnapshot', 'value', '') + '\n\n' + report(),
    name: 'toMatchSnapshot',
    pass: false,
    report,
  };
};

const toThrowErrorMatchingSnapshot = function(
  received: any,
  testName?: string,
) {
  this.dontThrow && this.dontThrow();
  const {isNot} = this;

  if (isNot) {
    throw new Error(
      'Jest: `.not` cannot be used with `.toThrowErrorMatchingSnapshot()`.',
    );
  }

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

  return toMatchSnapshot.call(this, error.message, testName);
};

module.exports = {
  EXTENSION: utils.SNAPSHOT_EXTENSION,
  SnapshotState,
  addSerializer,
  cleanup,
  getSerializers,
  toMatchSnapshot,
  toThrowErrorMatchingSnapshot,
  utils,
};
