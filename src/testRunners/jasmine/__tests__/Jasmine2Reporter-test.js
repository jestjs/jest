/**
 * Copyright (c) 2015, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.autoMockOff();

describe('Jasmine2Reporter', function() {
  var JasmineReporter;
  var chalk;
  var reporter;

  beforeEach(function() {
    JasmineReporter = require('../Jasmine2Reporter');
    chalk = require('chalk');

    reporter = new JasmineReporter();
  });

  describe('suites', function() {

    pit('reports nested suites', function() {
      var makeSpec = function(name) {
        return {
          fullName: name,
          description: 'description',
          failedExpectations: [],
        };
      };
      reporter.suiteStarted({description: 'parent'});
      reporter.suiteStarted({description: 'child'});
      reporter.specDone(makeSpec('spec 1'));
      reporter.suiteDone();
      reporter.suiteStarted({description: 'child 2'});
      reporter.specDone(makeSpec('spec 2'));
      reporter.jasmineDone();

      return reporter.getResults().then(function(runResults) {

        var firstResult = runResults.testResults[0];
        expect(firstResult.ancestorTitles[0]).toBe('parent');
        expect(firstResult.ancestorTitles[1]).toBe('child');
        var secondResult = runResults.testResults[1];
        expect(secondResult.ancestorTitles[1]).toBe('child 2');

      });
    });

  });

  describe('colorization', function() {

    function getFailedResult(actualResult, expectedResult) {
      var desc = 'comparing ' + actualResult + ' to ' + expectedResult;
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

    function getExceptionResult(stack) {
      return {
        fullName: '',
        description: '',
        failedExpectations: [
          {
            matcherName: '',
            stack: stack,
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

    pit('colorizes single-line failures using a per-char diff', function() {
      var result = getFailedResult('foo', 'foobar');
      reporter.specDone(result);
      reporter.jasmineDone();

      return reporter.getResults().then(function(result) {
        var message = result.testResults[0].failureMessages[0];
        expect(message).toBe(
          errorize('Expected:') + ' \'foo\' ' +
          errorize('toBe:') + ' \'foo' + highlight('bar') + '\''
        );
      });
    });

    pit('colorizes multi-line failures using a per-line diff', function() {
      var result = getFailedResult('foo\nbar\nbaz', 'foo\nxxx\nbaz');
      reporter.specDone(result);
      reporter.jasmineDone();

      return reporter.getResults().then(function(result) {
        var message = result.testResults[0].failureMessages[0];
        expect(message).toBe(
          errorize('Expected:') + ' \'foo\n' + highlight('bar\n') + 'baz\' ' +
          errorize('toBe:') + ' \'foo\n' + highlight('xxx\n') + 'baz\''
        );
      });
    });

    pit('colorizes exception messages', function() {
      var result = getExceptionResult(
        'Error: foobar = {\n' +
        '      attention: "bar"\n' +
        '    }\n' +
        '    at Error (<anonymous>)\n' +
        '    at Baz.js (<anonymous>)'
      );
      reporter.specDone(result);
      reporter.jasmineDone();

      return reporter.getResults().then(function(result) {
        var message = result.testResults[0].failureMessages[0];
        expect(message).toBe(
          errorize(
            'Error: foobar = {\n' +
            '      attention: "bar"\n' +
            '    }'
          ) + '\n    at Error (<anonymous>)\n' +
          '    at Baz.js (<anonymous>)'
        );
      });

    });

  });
});
