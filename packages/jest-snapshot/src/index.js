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

const SnapshotState = require('./State');
const {SnapshotFile, SNAPSHOT_EXTENSION} = require('./SnapshotFile');
const diff = require('jest-diff');
const fileExists = require('jest-file-exists');
const fs = require('fs');
const path = require('path');
const {
 EXPECTED_COLOR,
 matcherHint,
 RECEIVED_COLOR,
} = require('jest-matcher-utils');

const EXTENSION = SNAPSHOT_EXTENSION;

const cleanup = (hasteFS: HasteFS, update: boolean) => {
  const pattern = '\\.' + EXTENSION + '$';
  const files = hasteFS.matchFiles(pattern);
  const filesRemoved = files
    .filter(snapshotFile => !fileExists(
      path.resolve(
        path.dirname(snapshotFile),
        '..',
        path.basename(snapshotFile, '.' + EXTENSION),
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

const matcher = function(received: any) {
  this.dontThrow();
  const {currentTestName, isNot, snapshotState} = this;

  if (isNot) {
    throw new Error(
      'Jest: `.not` can not be used with `.toMatchSnapshot()`.',
    );
  }

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
      matcherHint('.toMatchSnapshot', 'value', '') + '\n\n' +
      `${RECEIVED_COLOR('Received value')} does not match ` +
      `${EXPECTED_COLOR('stored snapshot ' + count)}.\n\n` +
      (diffMessage || (
        RECEIVED_COLOR('- ' + expectedString) + '\n' +
        EXPECTED_COLOR('+ ' + actualString)
      ));

    return {pass: false, message};
  }
};

module.exports = {
  EXTENSION,
  cleanup,
  getSnapshotState,
  initializeSnapshotState,
  toMatchSnapshot: matcher,
  SnapshotFile,
};
