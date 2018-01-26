/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

import SummaryReporter from '../summary_reporter';

const env = Object.assign({}, process.env);
const write = process.stderr.write;
const globalConfig = {
  watch: false,
};
const aggregatedResults = {
  numTotalTestSuites: 1,
  snapshot: {
    filesUnmatched: 1,
    unmatched: 2,
  },
  testResults: {},
};

let results = [];

beforeEach(() => {
  process.env.npm_lifecycle_event = 'test';
  process.env.npm_lifecycle_script = 'jest';
  process.stderr.write = result => results.push(result);
});

afterEach(() => {
  results = [];
  process.env = env;
  process.stderr.write = write;
});

test('npm test', () => {
  process.env.npm_config_user_agent = 'npm';
  process.stderr.write = result => results.push(result);
  const testReporter = new SummaryReporter(globalConfig);
  testReporter.onRunComplete(new Set(), aggregatedResults);
  expect(results[0] + results[1]).toMatchSnapshot();
});

test('yarn test', () => {
  process.env.npm_config_user_agent = 'yarn';
  const testReporter = new SummaryReporter(globalConfig);
  testReporter.onRunComplete(new Set(), aggregatedResults);
  expect(results[0] + results[1]).toMatchSnapshot();
});
