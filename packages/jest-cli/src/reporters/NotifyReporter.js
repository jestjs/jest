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
import type {Context} from 'types/Context';

const path = require('path');
const util = require('util');
const notifier = require('node-notifier');
const BaseReporter = require('./BaseReporter');

const isDarwin = process.platform === 'darwin';

const icon = path.resolve(__dirname, '../assets/jest_logo.png');

class NotifyReporter extends BaseReporter {
  _startRun: () => *;

  constructor(startRun: () => *) {
    super();
    this._startRun = startRun;
  }

  onRunComplete(contexts: Set<Context>, result: AggregatedResult): void {
    const success =
      result.numFailedTests === 0 && result.numRuntimeErrorTestSuites === 0;

    if (success) {
      const title = util.format('%d%% Passed', 100);
      const message = util.format(
        (isDarwin ? '\u2705 ' : '') + '%d tests passed',
        result.numPassedTests,
      );

      notifier.notify({icon, message, title});
    } else {
      const failed = result.numFailedTests / result.numTotalTests;

      const title = util.format(
        '%d%% Failed',
        Math.ceil(Number.isNaN(failed) ? 0 : failed * 100),
      );
      const message = util.format(
        (isDarwin ? '\u26D4\uFE0F ' : '') + '%d of %d tests failed',
        result.numFailedTests,
        result.numTotalTests,
      );

      const restartAnswer = 'Run again';
      const quitAnswer = 'Exit tests';
      notifier.notify(
        {
          actions: [restartAnswer, quitAnswer],
          closeLabel: 'Close',
          icon,
          message,
          title,
        },
        (err, _, metadata) => {
          if (err || !metadata) {
            return;
          }
          if (metadata.activationValue === quitAnswer) {
            process.exit(0);
            return;
          }
          if (metadata.activationValue === restartAnswer) {
            this._startRun();
          }
        },
      );
    }
  }
}

module.exports = NotifyReporter;
