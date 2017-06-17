/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

<<<<<<< HEAD
 import type {GlobalConfig, Path, ProjectConfig} from 'types/Config';
 import type {Plugin} from 'types/PrettyFormat';
=======
import type {GlobalConfig, Path, ProjectConfig} from 'types/Config';
import type {Plugin} from 'types/PrettyFormat';

>>>>>>> origin/use-extractExpectedAssertionsErrors-in-jasmine

 import {getState, setState, extractExpectedAssertionsErrors} from 'jest-matchers';
 import {SnapshotState, addSerializer} from 'jest-snapshot';
 import {
   EXPECTED_COLOR,
   RECEIVED_COLOR,
   matcherHint,
   pluralize,
 } from 'jest-matcher-utils';

<<<<<<< HEAD
 export type SetupOptions = {|
   config: ProjectConfig,
   globalConfig: GlobalConfig,
   localRequire: (moduleName: string) => Plugin,
   testPath: Path,
 |};
=======
const {getState, setState, extractExpectedAssertionsErrors} = require('jest-matchers');
const {initializeSnapshotState, addSerializer} = require('jest-snapshot');
const {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  matcherHint,
  pluralize,
} from 'jest-matcher-utils';

export type SetupOptions = {|
  config: ProjectConfig,
  globalConfig: GlobalConfig,
  localRequire: (moduleName: string) => Plugin,
  testPath: Path,
|};
>>>>>>> origin/use-extractExpectedAssertionsErrors-in-jasmine

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

const addAssertionErrors = () => {
  extractExpectedAssertionsErrors();
}

const patchJasmine = () => {
  global.jasmine.Spec = (realSpec => {
    const Spec = function Spec(attr) {
      const resultCallback = attr.resultCallback;
      attr.resultCallback = function(result) {
        addSuppressedErrors(result);
        addAssertionErrors();
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
