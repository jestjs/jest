/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {
  TestFileAssertionStatus,
  TestAssertionStatus,
  TestReconciliationState,
} from './types';

import type {
  FormattedAssertionResult,
  FormattedTestResults,
} from 'types/TestResult';

import path from 'path';

/**
 *  You have a Jest test runner watching for changes, and you have
 *  an extension that wants to know where to show errors after file parsing.
 *
 *  This class represents the state between runs, keeping track of passes/fails
 *  at a file level, generating useful error messages and providing a nice API.
 */

module.exports = class TestReconciler {
  fileStatuses: any;
  fails: Array<TestFileAssertionStatus>;
  passes: Array<TestFileAssertionStatus>;
  skips: Array<TestFileAssertionStatus>;

  constructor() {
    this.fileStatuses = {};
  }

  updateFileWithJestStatus(results: FormattedTestResults) {
    this.fails = [];
    this.passes = [];
    this.skips = [];

    // Loop through all files inside the report from Jest
    results.testResults.forEach(file => {
      // Did the file pass/fail?
      const status = this.statusToReconcilationState(file.status);
      // Create our own simpler representation
      const fileStatus: TestFileAssertionStatus = {
        assertions: this.mapAssertions(file.name, file.assertionResults),
        file: file.name,
        message: file.message,
        status,
      };
      this.fileStatuses[file.name] = fileStatus;

      if (status === 'KnownFail') {
        this.fails.push(fileStatus);
      } else if (status === 'KnownSuccess') {
        this.passes.push(fileStatus);
      } else if (status === 'KnownSkip') {
        this.skips.push(fileStatus);
      }
    });
  }

  failedStatuses(): Array<TestFileAssertionStatus> {
    return this.fails || [];
  }

  passedStatuses(): Array<TestFileAssertionStatus> {
    return this.passes || [];
  }

  skipedStatuses(): Array<TestFileAssertionStatus> {
    return this.skips || [];
  }

  // A failed test also contains the stack trace for an `expect`
  // we don't get this as structured data, but what we get
  // is useful enough to make it for ourselves

  mapAssertions(
    filename: string,
    assertions: Array<FormattedAssertionResult>,
  ): Array<TestAssertionStatus> {
    // Is it jest < 17? e.g. Before I added this to the JSON
    if (!assertions) {
      return [];
    }

    // Change all failing assertions into structured data
    return assertions.map(assertion => {
      // Failure messages seems to always be an array of one item
      const message = assertion.failureMessages && assertion.failureMessages[0];
      let short = null;
      let terse = null;
      let line = null;
      if (message) {
        // Just the first line, with little whitespace
        short = message.split('   at', 1)[0].trim();
        // this will show inline, so we want to show very little
        terse = this.sanitizeShortErrorMessage(short);
        line = this.lineOfError(message, filename);
      }
      return {
        line,
        message: message || '',
        shortMessage: short,
        status: this.statusToReconcilationState(assertion.status),
        terseMessage: terse,
        title: assertion.title,
      };
    });
  }

  // Do everything we can to try make a one-liner from the error report
  sanitizeShortErrorMessage(string: string): string {
    if (string.includes('does not match stored snapshot')) {
      return 'Snapshot has changed';
    }

    if (string.includes('New snapshot was not written')) {
      return 'New snapshot is ready to write';
    }

    return string
      .split('\n')
      .splice(2)
      .join('')
      .replace(/\s\s+/g, ' ')
      .replace('Received:', ', Received:')
      .split('Difference:')[0];
  }

  // Pull the line out from the stack trace
  lineOfError(message: string, filePath: string): ?number {
    const filename = path.basename(filePath);
    const restOfTrace = message.split(filename, 2)[1];
    return restOfTrace ? parseInt(restOfTrace.split(':')[1], 10) : null;
  }

  statusToReconcilationState(status: string): TestReconciliationState {
    switch (status) {
      case 'passed':
        return 'KnownSuccess';
      case 'failed':
        return 'KnownFail';
      case 'pending':
        return 'KnownSkip';
      default:
        return 'Unknown';
    }
  }

  stateForTestFile(file: string): TestReconciliationState {
    const results = this.fileStatuses[file];
    if (!results) {
      return 'Unknown';
    }
    return results.status;
  }

  stateForTestAssertion(
    file: string,
    name: string,
  ): TestAssertionStatus | null {
    const results = this.fileStatuses[file];
    if (!results) {
      return null;
    }
    const assertion = results.assertions.find(a => a.title === name);
    if (!assertion) {
      return null;
    }
    return assertion;
  }
};
