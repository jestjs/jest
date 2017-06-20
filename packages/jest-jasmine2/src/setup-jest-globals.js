/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {GlobalConfig, Path, ProjectConfig} from 'types/Config';
import type {Plugin} from 'types/PrettyFormat';

import {
  getState,
  setState,
  extractExpectedAssertionsErrors,
} from 'jest-matchers';
import {SnapshotState, addSerializer} from 'jest-snapshot';

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

const addAssertionErrors = result => {
  const assertionErrors = extractExpectedAssertionsErrors();
  if (assertionErrors.length) {
    result.status = 'failed';
    result.failedExpectations = assertionErrors.map(error => ({
      actual: 'none',
      expected: 'at least one',
      message: error,
      passed: false,
    }));
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
  patchJasmine();
  const {expand, updateSnapshot} = globalConfig;
  const snapshotState = new SnapshotState(testPath, {expand, updateSnapshot});
  setState({snapshotState, testPath});
  // Return it back to the outer scope (test runner outside the VM).
  return snapshotState;
};
