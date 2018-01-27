/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

import SummaryReporter from '../summary_reporter';

const env = Object.assign({}, process.env);
const now = Date.now;
const write = process.stderr.write;
const globalConfig = {
  watch: false,
};
const aggregatedResults = {
  numFailedTestSuites: 1,
  numFailedTests: 1,
  numPassedTestSuites: 0,
  numTotalTestSuites: 1,
  numTotalTests: 1,
  snapshot: {
    filesUnmatched: 1,
    total: 2,
    unmatched: 2,
  },
  startTime: 0,
  testResults: {},
};

let results = [];

beforeEach(() => {
  process.env.npm_lifecycle_event = 'test';
  process.env.npm_lifecycle_script = 'jest';
  process.stderr.write = result => results.push(result);
  Date.now = () => 10;
});

afterEach(() => {
  results = [];
  process.env = env;
  process.stderr.write = write;
  Date.now = now;
});

test('snapshots needs update with npm test', () => {
  process.env.npm_config_user_agent = 'npm';
  const testReporter = new SummaryReporter(globalConfig);
  testReporter.onRunComplete(new Set(), aggregatedResults);
  expect(results.join('')).toMatchSnapshot();
});

test('snapshots needs update with yarn test', () => {
  process.env.npm_config_user_agent = 'yarn';
  const testReporter = new SummaryReporter(globalConfig);
  testReporter.onRunComplete(new Set(), aggregatedResults);
  expect(results.join('')).toMatchSnapshot();
});
