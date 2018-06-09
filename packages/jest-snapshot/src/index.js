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

const toMatchSnapshot = function(
  received: any,
  propertyMatchers?: any,
  testName?: string,
) {
  return _toMatchSnapshot({
    context: this,
    propertyMatchers,
    received,
    testName,
  });
};

const toMatchInlineSnapshot = function(
  received: any,
  propertyMatchersOrInlineSnapshot?: any,
  inlineSnapshot?: string,
) {
  let propertyMatchers;
  if (typeof propertyMatchersOrInlineSnapshot === 'string') {
    inlineSnapshot = propertyMatchersOrInlineSnapshot;
  } else {
    propertyMatchers = propertyMatchersOrInlineSnapshot;
  }
  return _toMatchSnapshot({
    context: this,
    inlineSnapshot: inlineSnapshot || '',
    propertyMatchers,
    received,
  });
};

const _toMatchSnapshot = ({
  context,
  received,
  propertyMatchers,
  testName,
  inlineSnapshot,
}: {
  context: MatcherState & {dontThrow?: () => any},
  received: any,
  propertyMatchers?: any,
  testName?: string,
  inlineSnapshot?: string,
}) => {
  context.dontThrow && context.dontThrow();
  testName = typeof propertyMatchers === 'string' ? propertyMatchers : testName;

  const {currentTestName, isNot, snapshotState} = context;

  if (isNot) {
    throw new Error('Jest: `.not` cannot be used with `.toMatchSnapshot()`.');
  }

  if (!snapshotState) {
    throw new Error('Jest: snapshot state must be initialized.');
  }

  const fullTestName =
    testName && currentTestName
      ? `${currentTestName}: ${testName}`
      : currentTestName || '';

  if (typeof propertyMatchers === 'object') {
    const propertyPass = context.equals(received, propertyMatchers, [
      context.utils.iterableEquality,
      context.utils.subsetEquality,
    ]);

    if (!propertyPass) {
      const key = snapshotState.fail(fullTestName, received);

      const report = () =>
        `${RECEIVED_COLOR('Received value')} does not match ` +
        `${EXPECTED_COLOR(`snapshot properties for "${key}"`)}.\n\n` +
        `Expected snapshot to match properties:\n` +
        `  ${context.utils.printExpected(propertyMatchers)}` +
        `\nReceived:\n` +
        `  ${context.utils.printReceived(received)}`;

      return {
        message: () =>
          matcherHint('.toMatchSnapshot', 'value', 'properties') +
          '\n\n' +
          report(),
        name: 'toMatchSnapshot',
        pass: false,
        report,
      };
    } else {
      Object.assign(received, propertyMatchers);
    }
  }

  const result = snapshotState.match({
    inlineSnapshot,
    received,
    testName: fullTestName,
  });
  const {pass} = result;
  let {actual, expected} = result;

  let report;
  if (pass) {
    return {message: () => '', pass: true};
  } else if (!expected) {
    report = () =>
      `New snapshot was ${RECEIVED_COLOR('not written')}. The update flag ` +
      `must be explicitly passed to write a new snapshot.\n\n` +
      `This is likely because this test is run in a continuous integration ` +
      `(CI) environment in which snapshots are not written by default.\n\n` +
      `${RECEIVED_COLOR('Received value')} ` +
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
      `${EXPECTED_COLOR(`stored snapshot "${result.key}"`)}.\n\n` +
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
  fromPromise: boolean,
) {
  return _toThrowErrorMatchingSnapshot({
    context: this,
    fromPromise,
    received,
    testName,
  });
};

const toThrowErrorMatchingInlineSnapshot = function(
  received: any,
  fromPromiseOrInlineSnapshot: any,
  inlineSnapshot?: string,
) {
  let fromPromise;
  if (typeof propertyMatchersOrInlineSnapshot === 'string') {
    inlineSnapshot = fromPromiseOrInlineSnapshot;
  } else {
    fromPromise = fromPromiseOrInlineSnapshot;
  }
  return _toThrowErrorMatchingSnapshot({
    context: this,
    fromPromise,
    inlineSnapshot: inlineSnapshot || '',
    received,
  });
};

const _toThrowErrorMatchingSnapshot = ({
  context,
  received,
  testName,
  fromPromise,
  inlineSnapshot,
}: {
  context: MatcherState & {dontThrow?: () => any},
  received: any,
  testName?: string,
  fromPromise?: boolean,
  inlineSnapshot?: string,
}) => {
  context.dontThrow && context.dontThrow();

  const {isNot} = context;

  if (isNot) {
    throw new Error(
      'Jest: `.not` cannot be used with `.toThrowErrorMatchingSnapshot()`.',
    );
  }

  let error;

  if (fromPromise) {
    error = received;
  } else {
    try {
      received();
    } catch (e) {
      error = e;
    }
  }

  if (error === undefined) {
    throw new Error(
      matcherHint('.toThrowErrorMatchingSnapshot', '() => {}', '') +
        '\n\n' +
        `Expected the function to throw an error.\n` +
        `But it didn't throw anything.`,
    );
  }

  return _toMatchSnapshot({
    context,
    inlineSnapshot,
    received: error.message,
    testName,
  });
};

module.exports = {
  EXTENSION: utils.SNAPSHOT_EXTENSION,
  SnapshotState,
  addSerializer,
  cleanup,
  getSerializers,
  toMatchInlineSnapshot,
  toMatchSnapshot,
  toThrowErrorMatchingInlineSnapshot,
  toThrowErrorMatchingSnapshot,
  utils,
};
