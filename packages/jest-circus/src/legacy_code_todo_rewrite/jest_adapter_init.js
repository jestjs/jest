/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {TestResult, Status} from 'types/TestResult';
import type {GlobalConfig, Path, ProjectConfig} from 'types/Config';
import type {Event, TestEntry} from '../../types';

import {
  extractExpectedAssertionsErrors,
  getState,
  setState,
} from 'jest-matchers';
import {formatResultsErrors} from 'jest-message-util';
import {SnapshotState, addSerializer} from 'jest-snapshot';
import {addEventHandler, ROOT_DESCRIBE_BLOCK_NAME} from '../state';
import {getTestID} from '../utils';
import run from '../run';
import globals from '../index';

const initialize = ({
  config,
  globalConfig,
  localRequire,
  testPath,
}: {
  config: ProjectConfig,
  globalConfig: GlobalConfig,
  localRequire: Path => any,
  testPath: Path,
}) => {
  Object.assign(global, globals);

  global.xit = global.it.skip;
  global.xtest = global.it.skip;
  global.xdescribe = global.describe.skip;
  global.fit = global.it.only;
  global.fdescribe = global.describe.only;

  addEventHandler(eventHandler);

  // Jest tests snapshotSerializers in order preceding built-in serializers.
  // Therefore, add in reverse because the last added is the first tested.
  config.snapshotSerializers.concat().reverse().forEach(path => {
    addSerializer(localRequire(path));
  });

  const {expand, updateSnapshot} = globalConfig;
  const snapshotState = new SnapshotState(testPath, {expand, updateSnapshot});
  setState({snapshotState, testPath});

  // Return it back to the outer scope (test runner outside the VM).
  return {globals, snapshotState};
};

const runAndTransformResultsToJestFormat = async ({
  config,
  globalConfig,
  testPath,
}: {
  config: ProjectConfig,
  globalConfig: GlobalConfig,
  testPath: string,
}): Promise<TestResult> => {
  const result = await run();

  let numFailingTests = 0;
  let numPassingTests = 0;
  let numPendingTests = 0;

  for (const testResult of result) {
    switch (testResult.status) {
      case 'fail':
        numFailingTests += 1;
        break;
      case 'pass':
        numPassingTests += 1;
        break;
      case 'skip':
        numPendingTests += 1;
        break;
    }
  }

  const assertionResults = result.map(testResult => {
    let status: Status;
    switch (testResult.status) {
      case 'fail':
        status = 'failed';
        break;
      case 'pass':
        status = 'passed';
        break;
      case 'skip':
        status = 'pending';
        break;
    }

    const ancestorTitles = testResult.testPath.filter(
      name => name !== ROOT_DESCRIBE_BLOCK_NAME,
    );
    const title = ancestorTitles.pop();

    // $FlowFixMe Types are slightly incompatible and need to be refactored
    return {
      ancestorTitles,
      duration: testResult.duration,
      failureMessages: testResult.errors,
      fullName: ancestorTitles.concat(title).join(' '),
      numPassingAsserts: 0,
      status,
      title: testResult.testPath[testResult.testPath.length - 1],
    };
  });

  const failureMessage = formatResultsErrors(
    assertionResults,
    config,
    globalConfig,
    testPath,
  );

  return {
    console: null,
    failureMessage,
    numFailingTests,
    numPassingTests,
    numPendingTests,
    perfStats: {
      // populated outside
      end: 0,
      start: 0,
    },
    skipped: false,
    snapshot: {
      added: 0,
      fileDeleted: false,
      matched: 0,
      unchecked: 0,
      unmatched: 0,
      updated: 0,
    },
    sourceMaps: {},
    testFilePath: testPath,
    testResults: assertionResults,
  };
};

const eventHandler = (event: Event) => {
  switch (event.name) {
    case 'test_start': {
      setState({currentTestName: getTestID(event.test)});
      break;
    }
    case 'test_success':
    case 'test_failure': {
      _addSuppressedErrors(event.test);
      _addExpectedAssertionErrors(event.test);
      break;
    }
  }
};

const _addExpectedAssertionErrors = (test: TestEntry) => {
  const failures = extractExpectedAssertionsErrors();
  const errors = failures.map(failure => failure.error);
  test.errors = test.errors.concat(errors);
};

// Get suppressed errors from ``jest-matchers`` that weren't throw during
// test execution and add them to the test result, potentially failing
// a passing test.
const _addSuppressedErrors = (test: TestEntry) => {
  const {suppressedErrors} = getState();
  setState({suppressedErrors: []});
  if (suppressedErrors.length) {
    test.status = 'fail';
    test.errors = test.errors.concat(suppressedErrors);
  }
};

module.exports = {
  initialize,
  runAndTransformResultsToJestFormat,
};
