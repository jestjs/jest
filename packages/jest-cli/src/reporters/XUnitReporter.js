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

import type {AggregatedResult} from 'types/TestResult';
import type {Config} from 'types/Config';
import type {RunnerContext} from 'types/Reporters';

const BaseReporter = require('./BaseReporter');
const path = require('path');
const fs = require('fs');
const stripAnsi = require('strip-ansi');

class XUnitReporter extends BaseReporter {
  _estimatedTime: number;

  constructor(reporterConfig = {}) {
    super();
    if (!reporterConfig.file) {
      throw new Error(`
        XUnit reporter requires "file" config option to be set.
        Example:
          "reporters": [
            ['jest-cli/build/reporters/xunit', {"file": "<rootDir>/report.xml"}]
          ]
      `);
    }
    this._file = reporterConfig.file;
  }

  onRunComplete(
    config: Config,
    aggregatedResults: AggregatedResult,
    runnerContext: RunnerContext,
  ) {
    const makeTestcases = testResults => {
      return testResults.reduce(
        (testcases, testResult) => {
          // console.log(testResult);
          return testcases.concat({
            error: testResult.failureMessages.join('\n'),
            name: testResult.title,
            status: testResult.status,
            time: testResult.duration,
          });
        },
        [],
      );
    };

    const result = aggregatedResults.testResults.reduce(
      (suites, {testFilePath, testResults, testExecError}) => {
        const name = path.relative(config.rootDir, testFilePath);

        if (testExecError) {
          const error = testExecError.toString();
          const status = 'failed';
          return suites.concat({
            name,
            testcases: [{error, name, status, time: 0}],
          });
        } else {
          return suites.concat({name, testcases: makeTestcases(testResults)});
        }
      },
      [],
    );

    const makeTestcasesTags = testcases => {
      return testcases.map(({name, time, error, status}) => {
        const errorTag = error
          ? makeTag('error', {message: error, type: 'error'}, '', '      ')
          : '';
        return makeTag('testcase', {name, time}, errorTag, '    ');
      });
    };

    const testsuiteTags = result.map(suite => {
      const {testcases, name} = suite;
      const testCasesTags = makeTestcasesTags(testcases);
      const tests = testcases.length;
      const failures = testcases
        .filter(({status}) => status === 'failed').length;

      return makeTag(
        'testsuite',
        {failures, name, tests},
        testCasesTags.join('\n'),
        '  ',
      );
    }).join('\n');

    const testsuitesTag = makeTag('testsuites', {}, testsuiteTags, '');
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + testsuitesTag;
    try {
      fs.writeFileSync(this._file, xml);
    } catch (e) {
      console.error(`
        Failed to write xUnit report to ${this._file}
      `);
      throw e;
    }
  }
}

const makeTag = (name, props = {}, content, indent = '') => {
  let result = indent + '<' + name + ' ';
  Object.keys(props).forEach(key => {
    const value = stripAnsi(
      props[key]
        .toString()
        .replace(/\"/, '\"')
        .replace(/[<>]/, '')
        .replace('\n', ' '),
    );
    result += ` ${key}="${value}"`;
  });

  return content
    ? result + `>\n${content}\n${indent}</${name}>`
    : result + '/>';
};

module.exports = XUnitReporter;
