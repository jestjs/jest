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

const notifier = require('node-notifier');
const path = require('path');
const util = require('util');

const isDarwin = process.platform === 'darwin';

const ICON = '/assets/jest_logo.png';
const NOTIFICATIONS = {
  success: {
    title: '%d%% Passed',
    message: (isDarwin ? '\u2705 ' : '') + '%d tests passed',
    icon: ICON,
  },
  failure: {
    title: '%d%% Failed',
    message: (isDarwin ? '\u26D4\uFE0F ' : '') + '%d of %d tests failed',
    icon: ICON,
  },
};

type Notification = {
  title: string,
  message: string,
  icon: string,
};

class Notifier {

  static onTestResults(result: AggregatedResult): void {
    let info;
    let title;
    let message;

    if (result.success) {
      info = NOTIFICATIONS.success;
      title = util.format(info.title, 100);
      message = util.format(info.message, result.numPassedTests);
    } else {
      info = NOTIFICATIONS.failure;
      title = util.format(info.title, Math.ceil(
        (result.numFailedTests / result.numTotalTests) * 100,
      ));
      message = util.format(
        info.message,
        result.numFailedTests,
        result.numTotalTests,
      );
    }
    const icon = path.join(__dirname, info.icon);

    const notification = {
      title,
      message,
      icon,
    };

    this.trigger(notification);
  }

  static trigger(notification: Notification): void {
    notifier.notify(notification);
  }
}

module.exports = Notifier;
