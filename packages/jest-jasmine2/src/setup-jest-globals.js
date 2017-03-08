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

import type {Config, Path} from 'types/Config';

const {getState, setState} = require('jest-matchers');
const {initializeSnapshotState, addSerializer} = require('jest-snapshot');
const {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  matcherHint,
  pluralize,
} = require('jest-matcher-utils');

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
  const {assertionCalls, assertionsExpected} = getState();
  setState({
    assertionCalls: 0,
    assertionsExpected: null,
  });
  if (
    typeof assertionsExpected === 'number' &&
    assertionCalls !== assertionsExpected
  ) {
    const expected = EXPECTED_COLOR(pluralize('assertion', assertionsExpected));
    const message = new Error(
      matcherHint('.assertions', '', assertionsExpected, {
        isDirectExpectCall: true,
      }) +
        '\n\n' +
        `Expected ${expected} to be called but only received ` +
        `${RECEIVED_COLOR(pluralize('assertion call', assertionCalls))}.`,
    ).stack;
    result.status = 'failed';
    result.failedExpectations.push({
      actual: assertionCalls,
      expected: assertionsExpected,
      message,
      passed: false,
    });
  }
};

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

type Options = {
  testPath: Path,
  config: Config,
};

module.exports = ({testPath, config}: Options) => {
  // Jest tests snapshotSerializers in order preceding built-in serializers.
  // Therefore, add in reverse because the last added is the first tested.
  config.snapshotSerializers.concat().reverse().forEach(path => {
    // $FlowFixMe
    addSerializer(require(path));
  });
  setState({testPath});
  patchJasmine();
  const snapshotState = initializeSnapshotState(
    testPath,
    config.updateSnapshot,
    '',
    config.expand,
  );
  setState({snapshotState});
  // Return it back to the outer scope (test runner outside the VM).
  return snapshotState;
};
