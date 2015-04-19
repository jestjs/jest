/**
 * Copyright (c) 2015, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('mock-modules').autoMockOff();

describe('JasmineReporter', function() {
  // modules
  var JasmineReporter;
  var colors;

  // other variables
  var reporter;

  beforeEach(function() {
    JasmineReporter = require('../JasmineReporter');
    colors = require('../../lib/colors');

    reporter = new JasmineReporter();
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
            passed: false
          }
        ]
      };
    }

    function errorize(str) {
      return colors.RED + colors.BOLD + colors.UNDERLINE + str + colors.RESET;
    }

    function highlight(str) {
      return colors.RED_BG + str + colors.RESET;
    }

    pit('colorizes single-line failures using a per-char diff', function() {
      var result = getFailedResult('foo', 'foobar');
      reporter.specDone(result);

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

      return reporter.getResults().then(function(result) {
        var message = result.testResults[0].failureMessages[0];
        expect(message).toBe(
          errorize('Expected:') + ' \'foo\n' + highlight('bar\n') + 'baz\' ' +
          errorize('toBe:') + ' \'foo\n' + highlight('xxx\n') + 'baz\''
        );
      });
    });
  });
});
