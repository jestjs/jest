/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

import {TestPathPatterns} from '@jest/pattern';

let SummaryReporter;

const env = {...process.env};
const now = Date.now;
const write = process.stderr.write;
const globalConfig = {
  rootDir: 'root',
  testPathPatterns: new TestPathPatterns([]),
  watch: false,
};

let results = [];

function requireReporter() {
  jest.isolateModules(() => {
    SummaryReporter = require('../SummaryReporter').default;
  });
}

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
  const aggregatedResults = {
    numFailedTestSuites: 1,
    numFailedTests: 1,
    numPassedTestSuites: 0,
    numTotalTestSuites: 1,
    numTotalTests: 1,
    snapshot: {
      filesUnmatched: 1,
      total: 2,
      uncheckedKeysByFile: [],
      unmatched: 2,
    },
    startTime: 0,
    testResults: [],
  };

  process.env.npm_config_user_agent = 'npm';
  requireReporter();
  const testReporter = new SummaryReporter(globalConfig);
  testReporter.onRunComplete(new Set(), aggregatedResults);
  expect(results.join('')).toMatchSnapshot();
});

test('snapshots needs update with yarn test', () => {
  const aggregatedResults = {
    numFailedTestSuites: 1,
    numFailedTests: 1,
    numPassedTestSuites: 0,
    numTotalTestSuites: 1,
    numTotalTests: 1,
    snapshot: {
      filesRemovedList: [],
      filesUnmatched: 1,
      total: 2,
      uncheckedKeysByFile: [],
      unmatched: 2,
    },
    startTime: 0,
    testResults: [],
  };

  process.env.npm_config_user_agent = 'yarn';
  requireReporter();
  const testReporter = new SummaryReporter(globalConfig);
  testReporter.onRunComplete(new Set(), aggregatedResults);
  expect(results.join('')).toMatchSnapshot();
});

test('snapshots needs update when launched through npx', () => {
  const aggregatedResults = {
    numFailedTestSuites: 1,
    numFailedTests: 1,
    numPassedTestSuites: 0,
    numTotalTestSuites: 1,
    numTotalTests: 1,
    snapshot: {
      filesUnmatched: 1,
      total: 1,
      uncheckedKeysByFile: [],
      unmatched: 1,
    },
    startTime: 0,
    testResults: [],
  };

  // npx sets the lifecycle event to "npx" and the script to the jest binary.
  // The suite aliases process.env to one object, so put the agent back.
  const previousUserAgent = process.env.npm_config_user_agent;
  process.env.npm_lifecycle_event = 'npx';
  process.env.npm_lifecycle_script =
    '/tmp/project/node_modules/.bin/jest obs.test.js';
  process.env.npm_config_user_agent = 'npm';
  try {
    requireReporter();
    const testReporter = new SummaryReporter(globalConfig);
    testReporter.onRunComplete(new Set(), aggregatedResults);
    const output = results.join('');
    expect(output).toContain('re-run jest with `-u`');
    expect(output).not.toContain('npm run npx');
  } finally {
    if (previousUserAgent === undefined) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = previousUserAgent;
    }
  }
});

test('snapshots all have results (no update)', () => {
  const aggregatedResults = {
    numFailedTestSuites: 1,
    numFailedTests: 1,
    numPassedTestSuites: 0,
    numTotalTestSuites: 1,
    numTotalTests: 1,
    snapshot: {
      added: 1,
      didUpdate: false,
      filesAdded: 1,
      filesRemoved: 1,
      filesRemovedList: [],
      filesUnmatched: 1,
      filesUpdated: 1,
      matched: 2,
      total: 2,
      unchecked: 1,
      uncheckedKeysByFile: [
        {
          filePath: 'path/to/suite_one',
          keys: ['unchecked snapshot 1'],
        },
      ],
      unmatched: 1,
      updated: 1,
    },
    startTime: 0,
    testResults: [],
  };

  requireReporter();
  const testReporter = new SummaryReporter(globalConfig);
  testReporter.onRunComplete(new Set(), aggregatedResults);
  expect(results.join('').replaceAll('\\', '/')).toMatchSnapshot();
});

test('snapshots all have results (after update)', () => {
  const aggregatedResults = {
    numFailedTestSuites: 1,
    numFailedTests: 1,
    numPassedTestSuites: 0,
    numTotalTestSuites: 1,
    numTotalTests: 1,
    snapshot: {
      added: 1,
      didUpdate: true,
      filesAdded: 1,
      filesRemoved: 1,
      filesRemovedList: [],
      filesUnmatched: 1,
      filesUpdated: 1,
      matched: 2,
      total: 2,
      unchecked: 1,
      uncheckedKeysByFile: [
        {
          filePath: 'path/to/suite_one',
          keys: ['unchecked snapshot 1'],
        },
      ],
      unmatched: 1,
      updated: 1,
    },
    startTime: 0,
    testResults: [],
  };

  requireReporter();
  const testReporter = new SummaryReporter(globalConfig);
  testReporter.onRunComplete(new Set(), aggregatedResults);
  expect(results.join('').replaceAll('\\', '/')).toMatchSnapshot();
});

describe('summaryThreshold option', () => {
  const aggregatedResults = {
    numFailedTestSuites: 1,
    numFailedTests: 1,
    numPassedTestSuites: 2,
    numRuntimeErrorTestSuites: 0,
    numTotalTestSuites: 3,
    numTotalTests: 3,
    snapshot: {
      filesRemovedList: [],
      filesUnmatched: 0,
      total: 0,
      uncheckedKeysByFile: [],
      unmatched: 0,
    },
    startTime: 0,
    testResults: [
      {
        failureMessage: 'FailureMessage1',
        numFailingTests: 1,
        testFilePath: 'path1',
      },
      {
        failureMessage: 'FailureMessage2',
        numFailingTests: 1,
        testFilePath: 'path2',
      },
    ],
  };

  it('Should print failure messages when number of test suites is over the threshold', () => {
    const options = {
      summaryThreshold: aggregatedResults.numTotalTestSuites - 1,
    };

    requireReporter();
    const testReporter = new SummaryReporter(globalConfig, options);
    testReporter.onRunComplete(new Set(), aggregatedResults);
    expect(results.join('').replaceAll('\\', '/')).toMatchSnapshot();
  });

  it('Should not print failure messages when number of test suites is under the threshold', () => {
    const options = {
      summaryThreshold: aggregatedResults.numTotalTestSuites + 1,
    };

    requireReporter();
    const testReporter = new SummaryReporter(globalConfig, options);
    testReporter.onRunComplete(new Set(), aggregatedResults);
    expect(results.join('').replaceAll('\\', '/')).toMatchSnapshot();
  });

  it('Should not print failure messages when number of test suites is equal to the threshold', () => {
    const options = {
      summaryThreshold: aggregatedResults.numTotalTestSuites,
    };

    requireReporter();
    const testReporter = new SummaryReporter(globalConfig, options);
    testReporter.onRunComplete(new Set(), aggregatedResults);
    expect(results.join('').replaceAll('\\', '/')).toMatchSnapshot();
  });

  it('Should throw error if threshold is not a number', () => {
    const options = {
      summaryThreshold: 'not a number',
    };

    requireReporter();
    expect(() => new SummaryReporter(globalConfig, options)).toThrow(
      'The option summaryThreshold should be a number',
    );
  });
});
