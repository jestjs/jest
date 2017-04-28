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

import type {GlobalConfig, Path, ProjectConfig} from 'types/Config';
import type {Plugin} from 'types/PrettyFormat';

const {getState, setState} = require('jest-matchers');
const {initializeSnapshotState, addSerializer} = require('jest-snapshot');
const {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  matcherHint,
  pluralize,
} = require('jest-matcher-utils');

export type SetupOptions = {|
  config: ProjectConfig,
  globalConfig: GlobalConfig,
  localRequire: (moduleName: string) => Plugin,
  testPath: Path,
|};

// Get suppressed errors form  jest-matchers that weren't throw during
// test execution and add them to the test result, potentially failing
// a passing test.
const addSuppressedErrors = result => {
  const {suppressedErrors} = getState();
  setState({suppressedErrors: []});
  if (suppressedErrors.length) {
    result.status = 'failed';

    result.failedExpectations = suppressedErrors.map(error => ({
      actual: '',
      // passing error for custom test reporters
      error,
      expected: '',
      message: error.message,
      passed: false,
      stack: error.stack,
    }));
  }
};

function addAssertionErrors(result) {
  const {
    assertionCalls,
    expectedAssertionsNumber,
    isExpectingAssertions,
  } = getState();
  setState({
    assertionCalls: 0,
    expectedAssertionsNumber: null,
  });
  if (
    typeof expectedAssertionsNumber === 'number' &&
    assertionCalls !== expectedAssertionsNumber
  ) {
    const expected = EXPECTED_COLOR(
      pluralize('assertion', expectedAssertionsNumber),
    );
    const message = new Error(
      matcherHint('.assertions', '', String(expectedAssertionsNumber), {
        isDirectExpectCall: true,
      }) +
        '\n\n' +
        `Expected ${expected} to be called but only received ` +
        RECEIVED_COLOR(pluralize('assertion call', assertionCalls || 0)) +
        '.',
    ).stack;
    result.status = 'failed';
    result.failedExpectations.push({
      actual: assertionCalls,
      expected: expectedAssertionsNumber,
      message,
      passed: false,
    });
  }
  if (isExpectingAssertions && assertionCalls === 0) {
    const expected = EXPECTED_COLOR('at least one assertion');
    const received = RECEIVED_COLOR('received none');
    const message = new Error(
      matcherHint('.hasAssertions', '', '', {
        isDirectExpectCall: true,
      }) +
        '\n\n' +
        `Expected ${expected} to be called but ${received}.`,
    ).stack;
    result.status = 'failed';
    result.failedExpectations.push({
      actual: 'none',
      expected: 'at least one',
      message,
      passed: false,
    });
  }
}

const patchJasmine = () => {
  global.jasmine.Spec = (realSpec => {
    const Spec = function Spec(attr) {
      const resultCallback = attr.resultCallback;
      attr.resultCallback = function(result) {
        addSuppressedErrors(result);
        addAssertionErrors(result);
        resultCallback.call(attr, result);
      };
      const onStart = attr.onStart;
      attr.onStart = context => {
        setState({currentTestName: context.getFullName()});
        onStart && onStart.call(attr, context);
      };
      realSpec.call(this, attr);
    };

    Spec.prototype = realSpec.prototype;
    for (const statics in realSpec) {
      if (Object.prototype.hasOwnProperty.call(realSpec, statics)) {
        Spec[statics] = realSpec[statics];
      }
    }
    return Spec;
  })(global.jasmine.Spec);
};

module.exports = ({
  config,
  globalConfig,
  localRequire,
  testPath,
}: SetupOptions) => {
  // Jest tests snapshotSerializers in order preceding built-in serializers.
  // Therefore, add in reverse because the last added is the first tested.
  config.snapshotSerializers.concat().reverse().forEach(path => {
    addSerializer(localRequire(path));
  });
  setState({testPath});
  patchJasmine();
  const snapshotState = initializeSnapshotState(
    testPath,
    globalConfig.updateSnapshot,
    '',
    globalConfig.expand,
  );
  setState({snapshotState});
  // Return it back to the outer scope (test runner outside the VM).
  return snapshotState;
};
