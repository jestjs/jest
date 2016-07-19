/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

jest.disableAutomock();

const TestRunner = require('../TestRunner');
const SummaryReporter = require('../reporters/SummaryReporter');

test('.addReporter() .removeReporter()', () => {
  const runner = new TestRunner({}, {});
  const reporter = new SummaryReporter();
  runner.addReporter(reporter);
  expect(runner._dispatcher._reporters).toContain(reporter);
  runner.removeReporter(SummaryReporter);
  expect(runner._dispatcher._reporters).not.toContain(reporter);
});
