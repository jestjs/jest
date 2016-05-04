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

describe('JasmineReporter', () => {
  // modules
  let JasmineReporter;
  let chalk;

  // other variables
  let reporter;

  beforeEach(() => {
    JasmineReporter = require('../reporter');
    chalk = require('chalk');

    reporter = new JasmineReporter({});
  });

  describe('colorization', () => {
    function getRunner(item) {
      return {
        suites: () => {
          return [
            {
              parentSuite: null,
              specs: () => {
                return [
                  {
                    results: () => {
                      return {
                        getItems: () => {
                          return [item];
                        },
                      };
                    },
                  },
                ];
              },
              suites: () => { return []; },
            },
          ];
        },
      };
    }

    function getExpectedRunner(actualResult, expectedResult, passed) {
      return getRunner({
        actual: actualResult,
        expected: expectedResult,
        message: '',
        isNot: false,
        matcherName: 'toBe',
        passed: () => { return passed; },
        trace: {},
        type: 'expect',
      });
    }

    function errorize(str) {
      return chalk.bold.underline.red(str);
    }

    function highlight(str) {
      return chalk.bgRed(str);
    }

    it('colorizes single-line failures using a per-char diff', () => {
      const runner = getExpectedRunner('foo', 'foobar', false);
      reporter.reportRunnerResults(runner);

      return reporter.getResults().then(result => {
        const message = result.testResults[0].failureMessages[0];
        expect(message).toBe(
          errorize('Expected:') + ' \'foo\' ' +
          errorize('toBe:') + ' \'foo' + highlight('bar') + '\''
        );
      });
    });

    it('colorizes multi-line failures using a per-line diff', () => {
      const runner = getExpectedRunner('foo\nbar\nbaz', 'foo\nxxx\nbaz', false);
      reporter.reportRunnerResults(runner);

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
