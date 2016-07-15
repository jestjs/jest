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

const BaseReporter = require('./BaseReporter');
const notifier = require('node-notifier');
const path = require('path');
const util = require('util');

const isDarwin = process.platform === 'darwin';

const ICON = path.resolve(__dirname, '../assets/jest_logo.png');

class NotifyReporter extends BaseReporter {
  onRunComplete(config: Config, result: AggregatedResult): void {
    let title;
    let message;

    if (result.success) {
      title = util.format('%d%% Passed', 100);
      message = util.format(
        (isDarwin ? '\u2705 ' : '') + '%d tests passed',
        result.numPassedTests,
      );
    } else {
      title = util.format(
        '%d%% Failed',
        Math.ceil((result.numFailedTests / result.numTotalTests) * 100),
      );
      message = util.format(
        (isDarwin ? '\u26D4\uFE0F ' : '') + '%d of %d tests failed',
        result.numFailedTests,
        result.numTotalTests,
      );
    }

    notifier.notify({title, message, icon: ICON});
  }
}

module.exports = NotifyReporter;
