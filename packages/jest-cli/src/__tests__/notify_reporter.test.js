/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import TestScheduler from '../test_scheduler';
import NotifyReporter from '../reporters/notify_reporter';
import type {TestSchedulerContext} from '../test_scheduler';
import type {AggregatedResult} from '../../../../types/TestResult';

jest.mock('../reporters/default_reporter');
jest.mock('node-notifier', () => ({
  notify: jest.fn(),
}));

const initialContext: TestSchedulerContext = {
  firstRun: true,
  previousSuccess: false,
};

const aggregatedResultsSuccess: AggregatedResult = {
  numFailedTestSuites: 0,
  numFailedTests: 0,
  numPassedTestSuites: 1,
  numPassedTests: 3,
  numRuntimeErrorTestSuites: 0,
  numTotalTestSuites: 1,
  numTotalTests: 3,
  success: true,
};

const aggregatedResultsFailure: AggregatedResult = {
  numFailedTestSuites: 1,
  numFailedTests: 3,
  numPassedTestSuites: 0,
  numPassedTests: 9,
  numRuntimeErrorTestSuites: 0,
  numTotalTestSuites: 1,
  numTotalTests: 3,
  success: false,
};

const aggregatedResultsNoTests: AggregatedResult = {
  numFailedTestSuites: 0,
  numFailedTests: 0,
  numPassedTestSuites: 0,
  numPassedTests: 0,
  numPendingTestSuites: 0,
  numPendingTests: 0,
  numRuntimeErrorTestSuites: 0,
  numTotalTestSuites: 0,
  numTotalTests: 0,
};

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

test('.addReporter() .removeReporter()', () => {
  const scheduler = new TestScheduler(
    {},
    {},
    Object.assign({}, initialContext),
  );
  const reporter = new NotifyReporter();
  scheduler.addReporter(reporter);
  expect(scheduler._dispatcher._reporters).toContain(reporter);
  scheduler.removeReporter(NotifyReporter);
  expect(scheduler._dispatcher._reporters).not.toContain(reporter);
});

const testModes = (notifyMode: string, arl: Array<AggregatedResult>) => {
  const notify = require('node-notifier');

  let previousContext = initialContext;
  arl.forEach((ar, i) => {
    const newContext = Object.assign(previousContext, {
      firstRun: i === 0,
      previousSuccess: previousContext.previousSuccess,
    });
    const reporter = new NotifyReporter(
      {notify: true, notifyMode},
      {},
      newContext,
    );
    previousContext = newContext;
    reporter.onRunComplete(new Set(), ar);

    if (ar.numTotalTests === 0) {
      expect(notify.notify).not.toHaveBeenCalled();
    }
  });

  expect(
    notify.notify.mock.calls.map(([{message, title}]) => ({
      message: message.replace('\u26D4\uFE0F ', '').replace('\u2705 ', ''),
      title,
    })),
  ).toMatchSnapshot();
};

test('test always', () => {
  testModes('always', notifyEvents);
});

test('test success', () => {
  testModes('success', notifyEvents);
});

test('test change', () => {
  testModes('change', notifyEvents);
});

test('test success-change', () => {
  testModes('success-change', notifyEvents);
});

test('test failure-change', () => {
  testModes('failure-change', notifyEvents);
});

afterEach(() => {
  jest.clearAllMocks();
});
