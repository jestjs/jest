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
import {
  EXPECTED_COLOR,
  matcherHint,
  MatcherHintOptions,
  RECEIVED_COLOR,
} from 'jest-matcher-utils';
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

type MatchSnapshotConfig = {
  context: Context;
  expectedArgument: string;
  inlineSnapshot?: string;
  matcherName: string;
  options: MatcherHintOptions;
  propertyMatchers?: any;
  received: any;
  testName?: string;
};

const DID_NOT_THROW = 'Received function did not throw'; // same as toThrow
const NOT_SNAPSHOT_MATCHERS = '.not cannot be used with snapshot matchers';

// Display key in report when matcher fails same as in snapshot file,
// but with optional name argument in green.
const printKey = (path = '', name = '', count: number): string => {
  const hasPath = path.length !== 0;
  const hasName = name.length !== 0;

  return (
    '`' +
    (hasPath ? utils.escapeBacktickString(path) : '') +
    (hasPath && hasName ? ': ' : '') +
    (hasName ? EXPECTED_COLOR(utils.escapeBacktickString(name)) : '') +
    ' ' +
    count +
    '`'
  );
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
  const matcherName = 'toMatchSnapshot';
  let expectedArgument = '';
  let secondArgument = '';

  if (typeof propertyMatchers === 'object' && propertyMatchers !== null) {
    expectedArgument = 'properties';
    if (typeof testName === 'string' && testName.length !== 0) {
      secondArgument = 'name';
    }
  } else if (
    typeof propertyMatchers === 'string' &&
    propertyMatchers.length !== 0
  ) {
    expectedArgument = 'name';
  }

  const options: MatcherHintOptions = {
    isNot: this.isNot,
    promise: this.promise,
    secondArgument,
  };

  if (arguments.length === 3 && !propertyMatchers) {
    throw new Error(
      'Property matchers must be an object.\n\nTo provide a snapshot test name without property matchers, use: toMatchSnapshot("name")',
    );
  }

  return _toMatchSnapshot({
    context: this,
    expectedArgument,
    matcherName,
    options,
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
  const matcherName = 'toMatchInlineSnapshot';
  let expectedArgument = '';
  let secondArgument = '';

  if (typeof propertyMatchersOrInlineSnapshot === 'string') {
    expectedArgument = 'snapshot';
  } else if (
    typeof propertyMatchersOrInlineSnapshot === 'object' &&
    propertyMatchersOrInlineSnapshot !== null
  ) {
    expectedArgument = 'properties';
    if (typeof inlineSnapshot === 'string') {
      secondArgument = 'snapshot';
    }
  }

  const options: MatcherHintOptions = {
    isNot: this.isNot,
    promise: this.promise,
    secondArgument,
  };

  let propertyMatchers;
  if (typeof propertyMatchersOrInlineSnapshot === 'string') {
    inlineSnapshot = propertyMatchersOrInlineSnapshot;
  } else {
    propertyMatchers = propertyMatchersOrInlineSnapshot;
  }
  return _toMatchSnapshot({
    context: this,
    expectedArgument,
    inlineSnapshot: inlineSnapshot || '',
    matcherName,
    options,
    propertyMatchers,
    received,
  });
};

const _toMatchSnapshot = ({
  context,
  expectedArgument,
  inlineSnapshot,
  matcherName,
  options,
  propertyMatchers,
  received,
  testName,
}: MatchSnapshotConfig) => {
  context.dontThrow && context.dontThrow();
  testName = typeof propertyMatchers === 'string' ? propertyMatchers : testName;

  const {currentTestName, isNot, snapshotState} = context;

  if (isNot) {
    throw new Error(
      matcherHint(matcherName, undefined, expectedArgument, options) +
        '\n\n' +
        NOT_SNAPSHOT_MATCHERS,
    );
  }

  if (!snapshotState) {
    throw new Error(
      matcherHint(matcherName, undefined, expectedArgument, options) +
        '\n\nsnapshot state must be initialized',
    );
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
      const matched = /(\d+)$/.exec(key);
      const count = matched === null ? 1 : Number(matched[1]);

      const report = () =>
        `Snapshot key: ${printKey(currentTestName, testName, count)}\n\n` +
        `Expected properties: ${context.utils.printExpected(
          propertyMatchers,
        )}\n` +
        `Received value:      ${context.utils.printReceived(received)}`;

      return {
        message: () =>
          matcherHint(matcherName, undefined, expectedArgument, options) +
          '\n\n' +
          report(),
        name: matcherName,
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
  const {count, pass} = result;
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
      `Snapshot key: ${printKey(currentTestName, testName, count)}\n\n` +
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
      matcherHint(matcherName, undefined, expectedArgument, options) +
      '\n\n' +
      report(),
    name: matcherName,
    pass: false,
    report,
  };
};

const toThrowErrorMatchingSnapshot = function(
  this: Context,
  received: any,
  testName: string | undefined, // because error TS1016 for testName?: string
  fromPromise: boolean,
) {
  const matcherName = 'toThrowErrorMatchingSnapshot';
  const expectedArgument =
    typeof testName === 'string' && testName.length !== 0 ? 'name' : '';
  const options = {
    isNot: this.isNot,
    promise: this.promise,
    secondArgument: '',
  };

  return _toThrowErrorMatchingSnapshot(
    {
      context: this,
      expectedArgument,
      matcherName,
      options,
      received,
      testName,
    },
    fromPromise,
  );
};

const toThrowErrorMatchingInlineSnapshot = function(
  this: Context,
  received: any,
  inlineSnapshot?: string,
  fromPromise?: boolean,
) {
  const matcherName = 'toThrowErrorMatchingInlineSnapshot';
  const expectedArgument = typeof inlineSnapshot === 'string' ? 'snapshot' : '';
  const options: MatcherHintOptions = {
    isNot: this.isNot,
    promise: this.promise,
    secondArgument: '',
  };

  return _toThrowErrorMatchingSnapshot(
    {
      context: this,
      expectedArgument,
      inlineSnapshot: inlineSnapshot || '',
      matcherName,
      options,
      received,
    },
    fromPromise,
  );
};

const _toThrowErrorMatchingSnapshot = (
  {
    context,
    expectedArgument,
    inlineSnapshot,
    matcherName,
    options,
    received,
    testName,
  }: MatchSnapshotConfig,
  fromPromise?: boolean,
) => {
  context.dontThrow && context.dontThrow();
  const {isNot} = context;

  if (isNot) {
    throw new Error(
      matcherHint(matcherName, undefined, expectedArgument, options) +
        '\n\n' +
        NOT_SNAPSHOT_MATCHERS,
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
      matcherHint(matcherName, undefined, expectedArgument, options) +
        '\n\n' +
        DID_NOT_THROW,
    );
  }

  return _toMatchSnapshot({
    context,
    expectedArgument,
    inlineSnapshot,
    matcherName,
    options,
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
