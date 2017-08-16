/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const TestScheduler = require('../test_scheduler');
const SummaryReporter = require('../reporters/summary_reporter');

jest.mock('../reporters/default_reporter');

test('.addReporter() .removeReporter()', () => {
  const scheduler = new TestScheduler({}, {});
  const reporter = new SummaryReporter();
  scheduler.addReporter(reporter);
  expect(scheduler._dispatcher._reporters).toContain(reporter);
  scheduler.removeReporter(SummaryReporter);
  expect(scheduler._dispatcher._reporters).not.toContain(reporter);
});
