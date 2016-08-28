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

import type {MatchersContext} from '../../jest-matchers/src/types';

const diff = require('jest-diff');
const {
  EXPECTED_COLOR,
  matcherHint,
  RECEIVED_COLOR,
} = require('jest-matcher-utils');

module.exports = (
  actual: any,
  expected: void,
  {snapshotState, updateSnapshot}: MatchersContext,
) => {
  const snapshot = snapshotState.snapshot;
  const count = snapshotState.incrementCounter();
  const key = snapshotState.getSpecName() + ' ' + count;
  const hasSnapshot = snapshot.has(key);
  let pass = false;
  let message = '';

  if (
    !snapshot.fileExists() ||
    (hasSnapshot && updateSnapshot) ||
    !hasSnapshot
  ) {
    if (updateSnapshot) {
      if (!snapshot.matches(key, actual).pass) {
        if (hasSnapshot) {
          snapshotState.updated++;
        } else {
          snapshotState.added++;
        }
        snapshot.add(key, actual);
      } else {
        snapshotState.matched++;
      }
    } else {
      snapshot.add(key, actual);
      snapshotState.added++;
    }
    pass = true;
  } else {
    const matches = snapshot.matches(key, actual);
    pass = matches.pass;
    if (!pass) {
      snapshotState.unmatched++;
      message =
        `Received value does not match the stored snapshot ${count}.\n\n` +
        diff(
          matches.expected.trim(),
          matches.actual.trim(),
          {
            aAnnotation: 'Snapshot',
            bAnnotation: 'Received',
          },
        );
    } else {
      snapshotState.matched++;
    }
  }

  return {
    pass,
    message,
  };
};
