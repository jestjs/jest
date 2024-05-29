/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {types} from 'util';
import * as fs from 'graceful-fs';
import {escapeBacktickString} from '@jest/snapshot-utils';
import type {Config} from '@jest/types';
import type {MatcherFunctionWithContext} from 'expect';
import {
  BOLD_WEIGHT,
  EXPECTED_COLOR,
  type MatcherHintOptions,
  RECEIVED_COLOR,
  matcherErrorMessage,
  matcherHint,
  printWithType,
  stringify,
} from 'jest-matcher-utils';
import {EXTENSION, type SnapshotResolver} from './SnapshotResolver';
import {
  PROPERTIES_ARG,
  SNAPSHOT_ARG,
  bReceivedColor,
  matcherHintFromConfig,
  noColor,
  printExpected,
  printPropertiesAndReceived,
  printReceived,
  printSnapshotAndReceived,
} from './printSnapshot';
import type {Context, FileSystem, MatchSnapshotConfig} from './types';
import {deepMerge, serialize} from './utils';

export {addSerializer, getSerializers} from './plugins';
export {
  EXTENSION,
  buildSnapshotResolver,
  isSnapshotPath,
} from './SnapshotResolver';
export type {SnapshotResolver} from './SnapshotResolver';
export {default as SnapshotState} from './State';
export type {Context, SnapshotMatchers} from './types';

const DID_NOT_THROW = 'Received function did not throw'; // same as toThrow
const NOT_SNAPSHOT_MATCHERS = `Snapshot matchers cannot be used with ${BOLD_WEIGHT(
  'not',
)}`;

const INDENTATION_REGEX = /^([^\S\n]*)\S/m;

// Display name in report when matcher fails same as in snapshot file,
// but with optional hint argument in bold weight.
const printSnapshotName = (
  concatenatedBlockNames = '',
  hint = '',
  count: number,
): string => {
  const hasNames = concatenatedBlockNames.length > 0;
  const hasHint = hint.length > 0;

  return `Snapshot name: \`${
    hasNames ? escapeBacktickString(concatenatedBlockNames) : ''
  }${hasNames && hasHint ? ': ' : ''}${
    hasHint ? BOLD_WEIGHT(escapeBacktickString(hint)) : ''
  } ${count}\``;
};

function stripAddedIndentation(inlineSnapshot: string) {
  // Find indentation if exists.
  const match = inlineSnapshot.match(INDENTATION_REGEX);
  if (!match || !match[1]) {
    // No indentation.
    return inlineSnapshot;
  }

  const indentation = match[1];
  const lines = inlineSnapshot.split('\n');
  if (lines.length <= 2) {
    // Must be at least 3 lines.
    return inlineSnapshot;
  }

  if (lines[0].trim() !== '' || lines.at(-1)!.trim() !== '') {
    // If not blank first and last lines, abort.
    return inlineSnapshot;
  }

  for (let i = 1; i < lines.length - 1; i++) {
    if (lines[i] !== '') {
      if (lines[i].indexOf(indentation) !== 0) {
        // All lines except first and last should either be blank or have the same
        // indent as the first line (or more). If this isn't the case we don't
        // want to touch the snapshot at all.
        return inlineSnapshot;
      }

      lines[i] = lines[i].slice(indentation.length);
    }
  }

  // Last line is a special case because it won't have the same indent as others
  // but may still have been given some indent to line up.
  lines[lines.length - 1] = '';

  // Return inline snapshot, now at indent 0.
  inlineSnapshot = lines.join('\n');
  return inlineSnapshot;
}

const fileExists = (filePath: string, fileSystem: FileSystem): boolean =>
  fileSystem.exists(filePath) || fs.existsSync(filePath);

export const cleanup = (
  fileSystem: FileSystem,
  update: Config.SnapshotUpdateState,
  snapshotResolver: SnapshotResolver,
  testPathIgnorePatterns?: Config.ProjectConfig['testPathIgnorePatterns'],
): {
  filesRemoved: number;
  filesRemovedList: Array<string>;
} => {
  const pattern = `\\.${EXTENSION}$`;
  const files = fileSystem.matchFiles(pattern);
  let testIgnorePatternsRegex: RegExp | null = null;
  if (testPathIgnorePatterns && testPathIgnorePatterns.length > 0) {
    testIgnorePatternsRegex = new RegExp(testPathIgnorePatterns.join('|'));
  }

  const list = files.filter(snapshotFile => {
    const testPath = snapshotResolver.resolveTestPath(snapshotFile);

    // ignore snapshots of ignored tests
    if (testIgnorePatternsRegex && testIgnorePatternsRegex.test(testPath)) {
      return false;
    }

    if (!fileExists(testPath, fileSystem)) {
      if (update === 'all') {
        fs.unlinkSync(snapshotFile);
      }
      return true;
    }

    return false;
  });

  return {
    filesRemoved: list.length,
    filesRemovedList: list,
  };
};

export const toMatchSnapshot: MatcherFunctionWithContext<
  Context,
  [propertiesOrHint?: object | string, hint?: string]
> = function (received, propertiesOrHint, hint) {
  const matcherName = 'toMatchSnapshot';
  let properties;

  const length = arguments.length;
  if (length === 2 && typeof propertiesOrHint === 'string') {
    hint = propertiesOrHint;
  } else if (length >= 2) {
    if (typeof propertiesOrHint !== 'object' || propertiesOrHint === null) {
      const options: MatcherHintOptions = {
        isNot: this.isNot,
        promise: this.promise,
      };
      let printedWithType = printWithType(
        'Expected properties',
        propertiesOrHint,
        printExpected,
      );

      if (length === 3) {
        options.secondArgument = 'hint';
        options.secondArgumentColor = BOLD_WEIGHT;

        if (propertiesOrHint == null) {
          printedWithType +=
            "\n\nTo provide a hint without properties: toMatchSnapshot('hint')";
        }
      }

      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, PROPERTIES_ARG, options),
          `Expected ${EXPECTED_COLOR('properties')} must be an object`,
          printedWithType,
        ),
      );
    }

    // Future breaking change: Snapshot hint must be a string
    // if (arguments.length === 3 && typeof hint !== 'string') {}

    properties = propertiesOrHint;
  }

  return _toMatchSnapshot({
    context: this,
    hint,
    isInline: false,
    matcherName,
    properties,
    received,
  });
};

export const toMatchInlineSnapshot: MatcherFunctionWithContext<
  Context,
  [propertiesOrSnapshot?: object | string, inlineSnapshot?: string]
> = function (received, propertiesOrSnapshot, inlineSnapshot) {
  const matcherName = 'toMatchInlineSnapshot';
  let properties;

  const length = arguments.length;
  if (length === 2 && typeof propertiesOrSnapshot === 'string') {
    inlineSnapshot = propertiesOrSnapshot;
  } else if (length >= 2) {
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    if (length === 3) {
      options.secondArgument = SNAPSHOT_ARG;
      options.secondArgumentColor = noColor;
    }

    if (
      typeof propertiesOrSnapshot !== 'object' ||
      propertiesOrSnapshot === null
    ) {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, PROPERTIES_ARG, options),
          `Expected ${EXPECTED_COLOR('properties')} must be an object`,
          printWithType(
            'Expected properties',
            propertiesOrSnapshot,
            printExpected,
          ),
        ),
      );
    }

    if (length === 3 && typeof inlineSnapshot !== 'string') {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, PROPERTIES_ARG, options),
          'Inline snapshot must be a string',
          printWithType('Inline snapshot', inlineSnapshot, serialize),
        ),
      );
    }

    properties = propertiesOrSnapshot;
  }

  return _toMatchSnapshot({
    context: this,
    inlineSnapshot:
      inlineSnapshot === undefined
        ? undefined
        : stripAddedIndentation(inlineSnapshot),
    isInline: true,
    matcherName,
    properties,
    received,
  });
};

const _toMatchSnapshot = (config: MatchSnapshotConfig) => {
  const {context, hint, inlineSnapshot, isInline, matcherName, properties} =
    config;
  let {received} = config;

  /** If a test was ran with `test.failing`. Passed by Jest Circus. */
  const {testFailing = false} = context;

  if (!testFailing && context.dontThrow) {
    // Supress errors while running tests
    context.dontThrow();
  }

  const {currentConcurrentTestName, isNot, snapshotState} = context;
  const currentTestName =
    currentConcurrentTestName?.() ?? context.currentTestName;

  if (isNot) {
    throw new Error(
      matcherErrorMessage(
        matcherHintFromConfig(config, false),
        NOT_SNAPSHOT_MATCHERS,
      ),
    );
  }

  if (snapshotState == null) {
    // Because the state is the problem, this is not a matcher error.
    // Call generic stringify from jest-matcher-utils package
    // because uninitialized snapshot state does not need snapshot serializers.
    throw new Error(
      `${matcherHintFromConfig(config, false)}\n\n` +
        'Snapshot state must be initialized' +
        `\n\n${printWithType('Snapshot state', snapshotState, stringify)}`,
    );
  }

  const fullTestName =
    currentTestName && hint
      ? `${currentTestName}: ${hint}`
      : currentTestName || ''; // future BREAKING change: || hint

  if (typeof properties === 'object') {
    if (typeof received !== 'object' || received === null) {
      throw new Error(
        matcherErrorMessage(
          matcherHintFromConfig(config, false),
          `${RECEIVED_COLOR(
            'received',
          )} value must be an object when the matcher has ${EXPECTED_COLOR(
            'properties',
          )}`,
          printWithType('Received', received, printReceived),
        ),
      );
    }

    const propertyPass = context.equals(received, properties, [
      context.utils.iterableEquality,
      context.utils.subsetEquality,
    ]);

    if (propertyPass) {
      received = deepMerge(received, properties);
    } else {
      const key = snapshotState.fail(fullTestName, received);
      const matched = /(\d+)$/.exec(key);
      const count = matched === null ? 1 : Number(matched[1]);

      const message = () =>
        `${matcherHintFromConfig(config, false)}\n\n${printSnapshotName(
          currentTestName,
          hint,
          count,
        )}\n\n${printPropertiesAndReceived(
          properties,
          received,
          snapshotState.expand,
        )}`;

      return {
        message,
        name: matcherName,
        pass: false,
      };
    }
  }

  const result = snapshotState.match({
    error: context.error,
    inlineSnapshot,
    isInline,
    received,
    testFailing,
    testName: fullTestName,
  });
  const {actual, count, expected, pass} = result;

  if (pass) {
    return {message: () => '', pass: true};
  }

  const message =
    expected === undefined
      ? () =>
          `${matcherHintFromConfig(config, true)}\n\n${printSnapshotName(
            currentTestName,
            hint,
            count,
          )}\n\n` +
          `New snapshot was ${BOLD_WEIGHT('not written')}. The update flag ` +
          'must be explicitly passed to write a new snapshot.\n\n' +
          'This is likely because this test is run in a continuous integration ' +
          '(CI) environment in which snapshots are not written by default.\n\n' +
          `Received:${actual.includes('\n') ? '\n' : ' '}${bReceivedColor(
            actual,
          )}`
      : () =>
          `${matcherHintFromConfig(config, true)}\n\n${printSnapshotName(
            currentTestName,
            hint,
            count,
          )}\n\n${printSnapshotAndReceived(
            expected,
            actual,
            received,
            snapshotState.expand,
            snapshotState.snapshotFormat,
          )}`;

  // Passing the actual and expected objects so that a custom reporter
  // could access them, for example in order to display a custom visual diff,
  // or create a different error message
  return {
    actual,
    expected,
    message,
    name: matcherName,
    pass: false,
  };
};

export const toThrowErrorMatchingSnapshot: MatcherFunctionWithContext<
  Context,
  [hint?: string, fromPromise?: boolean]
> = function (received, hint, fromPromise) {
  const matcherName = 'toThrowErrorMatchingSnapshot';

  // Future breaking change: Snapshot hint must be a string
  // if (hint !== undefined && typeof hint !== string) {}

  return _toThrowErrorMatchingSnapshot(
    {
      context: this,
      hint,
      isInline: false,
      matcherName,
      received,
    },
    fromPromise,
  );
};

export const toThrowErrorMatchingInlineSnapshot: MatcherFunctionWithContext<
  Context,
  [inlineSnapshot?: string, fromPromise?: boolean]
> = function (received, inlineSnapshot, fromPromise) {
  const matcherName = 'toThrowErrorMatchingInlineSnapshot';

  if (inlineSnapshot !== undefined && typeof inlineSnapshot !== 'string') {
    const options: MatcherHintOptions = {
      expectedColor: noColor,
      isNot: this.isNot,
      promise: this.promise,
    };

    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherName, undefined, SNAPSHOT_ARG, options),
        'Inline snapshot must be a string',
        printWithType('Inline snapshot', inlineSnapshot, serialize),
      ),
    );
  }

  return _toThrowErrorMatchingSnapshot(
    {
      context: this,
      inlineSnapshot:
        inlineSnapshot === undefined
          ? undefined
          : stripAddedIndentation(inlineSnapshot),
      isInline: true,
      matcherName,
      received,
    },
    fromPromise,
  );
};

const _toThrowErrorMatchingSnapshot = (
  config: MatchSnapshotConfig,
  fromPromise?: boolean,
) => {
  const {context, hint, inlineSnapshot, isInline, matcherName, received} =
    config;

  context.dontThrow && context.dontThrow();

  const {isNot, promise} = context;

  if (!fromPromise) {
    if (typeof received !== 'function') {
      const options: MatcherHintOptions = {isNot, promise};

      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, '', options),
          `${RECEIVED_COLOR('received')} value must be a function`,
          printWithType('Received', received, printReceived),
        ),
      );
    }
  }

  if (isNot) {
    throw new Error(
      matcherErrorMessage(
        matcherHintFromConfig(config, false),
        NOT_SNAPSHOT_MATCHERS,
      ),
    );
  }

  let error;

  if (fromPromise) {
    error = received;
  } else {
    try {
      received();
    } catch (receivedError) {
      error = receivedError;
    }
  }

  if (error === undefined) {
    // Because the received value is a function, this is not a matcher error.
    throw new Error(
      `${matcherHintFromConfig(config, false)}\n\n${DID_NOT_THROW}`,
    );
  }

  let message = error.message;
  while ('cause' in error) {
    error = error.cause;
    if (types.isNativeError(error) || error instanceof Error) {
      message += `\nCause: ${error.message}`;
    } else {
      if (typeof error === 'string') {
        message += `\nCause: ${error}`;
      }
      break;
    }
  }

  return _toMatchSnapshot({
    context,
    hint,
    inlineSnapshot,
    isInline,
    matcherName,
    received: message,
  });
};
