/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs';
import {Config} from '@jest/types';
import {FS as HasteFS} from 'jest-haste-map';
import {MatcherState} from 'expect';

import diff from 'jest-diff';
import {EXPECTED_COLOR, matcherHint, RECEIVED_COLOR} from 'jest-matcher-utils';
import {
  buildSnapshotResolver,
  isSnapshotPath,
  SnapshotResolver as JestSnapshotResolver,
  EXTENSION,
} from './snapshot_resolver';
import SnapshotState from './State';
import {addSerializer, getSerializers} from './plugins';
import * as utils from './utils';

type Context = MatcherState & {
  snapshotState: SnapshotState;
};

const fileExists = (filePath: Config.Path, hasteFS: HasteFS): boolean =>
  hasteFS.exists(filePath) || fs.existsSync(filePath);

const cleanup = (
  hasteFS: HasteFS,
  update: Config.SnapshotUpdateState,
  snapshotResolver: JestSnapshotResolver,
) => {
  const pattern = '\\.' + EXTENSION + '$';
  const files = hasteFS.matchFiles(pattern);
  const filesRemoved = files.reduce((acc, snapshotFile) => {
    if (!fileExists(snapshotResolver.resolveTestPath(snapshotFile), hasteFS)) {
      if (update === 'all') {
        fs.unlinkSync(snapshotFile);
      }
      return acc + 1;
    }

    return acc;
  }, 0);

  return {
    filesRemoved,
  };
};

const toMatchSnapshot = function(
  this: Context,
  received: any,
  propertyMatchers?: any,
  testName?: Config.Path,
) {
  if (arguments.length === 3 && !propertyMatchers) {
    throw new Error(
      'Property matchers must be an object.\n\nTo provide a snapshot test name without property matchers, use: toMatchSnapshot("name")',
    );
  }

  return _toMatchSnapshot({
    context: this,
    propertyMatchers,
    received,
    testName,
  });
};

const toMatchInlineSnapshot = function(
  this: Context,
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
  context: Context;
  received: any;
  propertyMatchers?: any;
  testName?: string;
  inlineSnapshot?: string;
}) => {
  context.dontThrow && context.dontThrow();
  testName = typeof propertyMatchers === 'string' ? propertyMatchers : testName;

  const {currentTestName, isNot, snapshotState} = context;

  if (isNot) {
    const matcherName =
      typeof inlineSnapshot === 'string'
        ? 'toMatchInlineSnapshot'
        : 'toMatchSnapshot';
    throw new Error(
      `Jest: \`.not\` cannot be used with \`.${matcherName}()\`.`,
    );
  }

  if (!snapshotState) {
    throw new Error('Jest: snapshot state must be initialized.');
  }

  const fullTestName =
    testName && currentTestName
      ? `${currentTestName}: ${testName}`
      : currentTestName || '';

  if (typeof propertyMatchers === 'object') {
    if (propertyMatchers === null) {
      throw new Error(`Property matchers must be an object.`);
    }
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
      received = utils.deepMerge(received, propertyMatchers);
    }
  }

  const result = snapshotState.match({
    error: context.error,
    inlineSnapshot,
    received,
    testName: fullTestName,
  });
  const {pass} = result;
  let {actual, expected} = result;

  let report: () => string;
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
  // Passing the actual and expected objects so that a custom reporter
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
  this: Context,
  received: any,
  testName: string | undefined,
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
  this: Context,
  received: any,
  inlineSnapshot?: string,
  fromPromise?: boolean,
) {
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
  context: Context;
  received: any;
  testName?: string;
  fromPromise?: boolean;
  inlineSnapshot?: string;
}) => {
  context.dontThrow && context.dontThrow();
  const {isNot} = context;
  const matcherName =
    typeof inlineSnapshot === 'string'
      ? 'toThrowErrorMatchingInlineSnapshot'
      : 'toThrowErrorMatchingSnapshot';

  if (isNot) {
    throw new Error(
      `Jest: \`.not\` cannot be used with \`.${matcherName}()\`.`,
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
      matcherHint(`.${matcherName}`, '() => {}', '') +
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

const JestSnapshot = {
  EXTENSION,
  SnapshotState,
  addSerializer,
  buildSnapshotResolver,
  cleanup,
  getSerializers,
  isSnapshotPath,
  toMatchInlineSnapshot,
  toMatchSnapshot,
  toThrowErrorMatchingInlineSnapshot,
  toThrowErrorMatchingSnapshot,
  utils,
};
/* eslint-disable-next-line no-redeclare */
namespace JestSnapshot {
  export type SnapshotResolver = JestSnapshotResolver;
  export type SnapshotStateType = SnapshotState;
}

export = JestSnapshot;
