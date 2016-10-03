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
const fileExists = require('jest-file-exists');
const fs = require('fs');
const path = require('path');
const SnapshotState = require('./State');
const {
 EXPECTED_COLOR,
 ensureNoExpected,
 matcherHint,
 RECEIVED_COLOR,
} = require('jest-matcher-utils');
const {SNAPSHOT_EXTENSION} = require('./utils');

const cleanup = (hasteFS: HasteFS, update: boolean) => {
  const pattern = '\\.' + SNAPSHOT_EXTENSION + '$';
  const files = hasteFS.matchFiles(pattern);
  const filesRemoved = files
    .filter(snapshotFile => !fileExists(
      path.resolve(
        path.dirname(snapshotFile),
        '..',
        path.basename(snapshotFile, '.' + SNAPSHOT_EXTENSION),
      ),
      hasteFS,
    ))
    .map(snapshotFile => {
      if (update) {
        fs.unlinkSync(snapshotFile);
      }
    })
    .length;

  return {
    filesRemoved,
  };
};

let snapshotState;

const initializeSnapshotState
  = (testFile: Path, update: boolean) => new SnapshotState(testFile, update);

const getSnapshotState = () => snapshotState;

const toMatchSnapshot = function(received: any, expected: void) {
  this.dontThrow();
  const {currentTestName, isNot, snapshotState} = this;

  if (isNot) {
    throw new Error(
      'Jest: `.not` cannot be used with `.toMatchSnapshot()`.',
    );
  }

  ensureNoExpected(expected, '.toMatchSnapshot');

  if (!snapshotState) {
    throw new Error('Jest: snapshot state must be initialized.');
  }

  const result = snapshotState.match(currentTestName, received);
  const {pass} = result;

  if (pass) {
    return {pass: true, message: ''};
  } else {
    const {count, expected, actual} = result;


    const expectedString = expected.trim();
    const actualString = actual.trim();
    const diffMessage = diff(
      expectedString,
      actualString,
      {
        aAnnotation: 'Snapshot',
        bAnnotation: 'Received',
      },
    );

    const message =
      () => matcherHint('.toMatchSnapshot', 'value', '') + '\n\n' +
      `${RECEIVED_COLOR('Received value')} does not match ` +
      `${EXPECTED_COLOR('stored snapshot ' + count)}.\n\n` +
      (diffMessage || (
        RECEIVED_COLOR('- ' + expectedString) + '\n' +
        EXPECTED_COLOR('+ ' + actualString)
      ));

    return {pass: false, message};
  }
};

const toThrowErrorMatchingSnapshot = function(received: any, expected: void) {
  this.dontThrow();
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
      matcherHint('.toThrowErrorMatchingSnapshot', '() => {}', '') + '\n\n' +
      `Expected the function to throw an error.\n` +
      `But it didn't throw anything.`,
    );
  }

  return toMatchSnapshot.call(this, error.message);
};

module.exports = {
  EXTENSION: SNAPSHOT_EXTENSION,
  SnapshotState,
  cleanup,
  getSnapshotState,
  initializeSnapshotState,
  toMatchSnapshot,
  toThrowErrorMatchingSnapshot,
};
