/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
import type {AssertionResult} from 'types/TestResult';

type Suite = {|
  suites: Array<Suite>,
  tests: Array<AssertionResult>,
  title: string,
|};

export default (testResults: Array<AssertionResult>): Suite => {
  const root = {suites: [], tests: [], title: ''};
  testResults.forEach(testResult => {
    let targetSuite = root;

    // Find the target suite for this test,
    // creating nested suites as necessary.
    for (const title of testResult.ancestorTitles) {
      let matchingSuite = targetSuite.suites.find(s => s.title === title);
      if (!matchingSuite) {
        matchingSuite = {suites: [], tests: [], title};
        targetSuite.suites.push(matchingSuite);
      }
      targetSuite = matchingSuite;
    }

    targetSuite.tests.push(testResult);
  });
  return root;
};
