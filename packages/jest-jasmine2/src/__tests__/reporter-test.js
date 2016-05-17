/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.disableAutomock();

describe('Jasmine2Reporter', () => {
  let JasmineReporter;
  let chalk;
  let reporter;

  beforeEach(() => {
    JasmineReporter = require('../reporter');
    chalk = require('chalk');

    reporter = new JasmineReporter({});
  });

  describe('suites', () => {

    it('reports nested suites', () => {
      const makeSpec = name => ({
        fullName: name,
        description: 'description',
        failedExpectations: [],
      });
      reporter.suiteStarted({description: 'parent'});
      reporter.suiteStarted({description: 'child'});
      reporter.specDone(makeSpec('spec 1'));
      reporter.suiteDone();
      reporter.suiteStarted({description: 'child 2'});
      reporter.specDone(makeSpec('spec 2'));
      reporter.jasmineDone();

      return reporter.getResults().then(runResults => {
        const firstResult = runResults.testResults[0];
        expect(firstResult.ancestorTitles[0]).toBe('parent');
        expect(firstResult.ancestorTitles[1]).toBe('child');
        const secondResult = runResults.testResults[1];
        expect(secondResult.ancestorTitles[1]).toBe('child 2');
      });
    });

  });

  describe('colorization', () => {

    function getFailedResult(actualResult, expectedResult) {
      const desc = 'comparing ' + actualResult + ' to ' + expectedResult;
      return {
        fullName: desc,
        description: desc,
        failedExpectations: [
          {
            actual: actualResult,
            expected: expectedResult,
            matcherName: 'toBe',
            passed: false,
          },
        ],
      };
    }

    function errorize(str) {
      return chalk.bold.underline.red(str);
    }

    function highlight(str) {
      return chalk.bgRed(str);
    }

    it('colorizes single-line failures using a per-char diff', () => {
      const result = getFailedResult('foo', 'foobar');
      reporter.specDone(result);
      reporter.jasmineDone();

      return reporter.getResults().then(result => {
        const message = result.testResults[0].failureMessages[0];
        expect(message).toBe(
          errorize('Expected:') + ' \'foo\' ' +
          errorize('toBe:') + ' \'foo' + highlight('bar') + '\''
        );
      });
    });

    it('colorizes multi-line failures using a per-line diff', () => {
      const result = getFailedResult('foo\nbar\nbaz', 'foo\nxxx\nbaz');
      reporter.specDone(result);
      reporter.jasmineDone();

      return reporter.getResults().then(result => {
        const message = result.testResults[0].failureMessages[0];
        expect(message).toBe(
          errorize('Expected:') + ' \'foo\n' + highlight('bar\n') + 'baz\' ' +
          errorize('toBe:') + ' \'foo\n' + highlight('xxx\n') + 'baz\''
        );
      });
    });
  });
});
