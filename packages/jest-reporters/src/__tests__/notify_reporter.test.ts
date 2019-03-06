/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AggregatedResult} from '@jest/test-result';
import {Config} from '@jest/types';
import NotifyReporter from '../notify_reporter';
import {makeGlobalConfig} from '../../../../TestUtils';

jest.mock('../default_reporter');
jest.mock('node-notifier', () => ({
  notify: jest.fn(),
}));

const initialContext = {
  firstRun: true,
  previousSuccess: false,
};

const aggregatedResultsSuccess = {
  numFailedTestSuites: 0,
  numFailedTests: 0,
  numPassedTestSuites: 1,
  numPassedTests: 3,
  numRuntimeErrorTestSuites: 0,
  numTotalTestSuites: 1,
  numTotalTests: 3,
  success: true,
} as AggregatedResult;

const aggregatedResultsFailure = {
  numFailedTestSuites: 1,
  numFailedTests: 3,
  numPassedTestSuites: 0,
  numPassedTests: 9,
  numRuntimeErrorTestSuites: 0,
  numTotalTestSuites: 1,
  numTotalTests: 3,
  success: false,
} as AggregatedResult;

const aggregatedResultsNoTests = {
  numFailedTestSuites: 0,
  numFailedTests: 0,
  numPassedTestSuites: 0,
  numPassedTests: 0,
  numPendingTestSuites: 0,
  numPendingTests: 0,
  numRuntimeErrorTestSuites: 0,
  numTotalTestSuites: 0,
  numTotalTests: 0,
} as AggregatedResult;

// Simulated sequence of events for NotifyReporter
const notifyEvents = [
  aggregatedResultsNoTests,
  aggregatedResultsSuccess,
  aggregatedResultsFailure,
  aggregatedResultsSuccess,
  aggregatedResultsSuccess,
  aggregatedResultsFailure,
  aggregatedResultsFailure,
];

const testModes = ({
  notifyMode,
  arl,
  rootDir,
  moduleName,
}: {arl: Array<AggregatedResult>; moduleName?: string} & Pick<
  Config.GlobalConfig,
  'notifyMode'
> &
  Partial<Pick<Config.ProjectConfig, 'rootDir'>>) => {
  const notify = require('node-notifier');

  const config = makeGlobalConfig({notify: true, notifyMode, rootDir});

  let previousContext = initialContext;
  arl.forEach((ar, i) => {
    const newContext = Object.assign(previousContext, {
      firstRun: i === 0,
      previousSuccess: previousContext.previousSuccess,
    });
    const reporter = new NotifyReporter(config, () => {}, newContext);
    previousContext = newContext;
    const contexts = new Set();

    if (moduleName != null) {
      contexts.add({
        hasteFS: {
          getModuleName() {
            return moduleName;
          },

          matchFiles() {
            return ['package.json'];
          },
        },
      });
    }

    reporter.onRunComplete(contexts, ar);

    if (ar.numTotalTests === 0) {
      expect(notify.notify).not.toHaveBeenCalled();
    }
  });

  const calls: Array<any> = notify.notify.mock.calls;
  expect(
    calls.map(([{message, title}]) => ({
      message: message.replace('\u26D4\uFE0F ', '').replace('\u2705 ', ''),
      title,
    })),
  ).toMatchSnapshot();
};

test('test always', () => {
  testModes({arl: notifyEvents, notifyMode: 'always'});
});

test('test success', () => {
  testModes({arl: notifyEvents, notifyMode: 'success'});
});

test('test change', () => {
  testModes({arl: notifyEvents, notifyMode: 'change'});
});

test('test success-change', () => {
  testModes({arl: notifyEvents, notifyMode: 'success-change'});
});

test('test failure-change', () => {
  testModes({arl: notifyEvents, notifyMode: 'failure-change'});
});

test('test always with rootDir', () => {
  testModes({arl: notifyEvents, notifyMode: 'always', rootDir: 'some-test'});
});

test('test success with rootDir', () => {
  testModes({arl: notifyEvents, notifyMode: 'success', rootDir: 'some-test'});
});

test('test change with rootDir', () => {
  testModes({arl: notifyEvents, notifyMode: 'change', rootDir: 'some-test'});
});

test('test success-change with rootDir', () => {
  testModes({
    arl: notifyEvents,
    notifyMode: 'success-change',
    rootDir: 'some-test',
  });
});

test('test failure-change with rootDir', () => {
  testModes({
    arl: notifyEvents,
    notifyMode: 'failure-change',
    rootDir: 'some-test',
  });
});

test('test always with moduleName', () => {
  testModes({
    arl: notifyEvents,
    moduleName: 'some-module',
    notifyMode: 'always',
  });
});

test('test success with moduleName', () => {
  testModes({
    arl: notifyEvents,
    moduleName: 'some-module',
    notifyMode: 'success',
  });
});

test('test change with moduleName', () => {
  testModes({
    arl: notifyEvents,
    moduleName: 'some-module',
    notifyMode: 'change',
  });
});

test('test success-change with moduleName', () => {
  testModes({
    arl: notifyEvents,
    moduleName: 'some-module',
    notifyMode: 'success-change',
  });
});

test('test failure-change with moduleName', () => {
  testModes({
    arl: notifyEvents,
    moduleName: 'some-module',
    notifyMode: 'failure-change',
  });
});

afterEach(() => {
  jest.clearAllMocks();
});
