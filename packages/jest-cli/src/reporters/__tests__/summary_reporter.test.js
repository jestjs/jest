/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const env = Object.assign({}, process.env);
const write = process.stderr.write;
let SummaryReporter;

beforeEach(() => {
  SummaryReporter = require('../summary_reporter').default;
});

afterEach(() => {
  process.env = env;
  process.stderr.write = write;
});

describe('onRunComplete', () => {
  test('myTest', () => {
    process.env.npm_config_user_agent = 'npm';
    process.env.npm_lifecycle_event = 'test';
    process.env.npm_lifecycle_script = 'jest';
    const results = [];
    process.stderr.write = result => results.push(result);
    const testReporter = new SummaryReporter({
      watch: false,
    });
    const aggregatedResults = {
      numTotalTestSuites: 1,
      snapshot: {
        filesUnmatched: 1,
        unmatched: 2,
      },
      testResults: {},
    };
    testReporter.onRunComplete(new Set(), aggregatedResults);
    expect(results[0]).toMatch('\u001b[1mSnapshot Summary\u001b[22m');
    expect(results[1]).toMatch(
      '\u001b[1m\u001b[31m › 2 snapshot tests\u001b[39m\u001b[22m failed in 1 test suite. ' +
        '\u001b[2mInspect your code changes or run `npm test -- -u` to update them.\u001b[22m',
    );
  });
});
