/**
* Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
*
* @flow
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/
'use strict';

import type {AggregatedResult} from 'types/TestResult';

const growl = require('growl');
const path = require('path');
const util = require('util');

const isDarwin = process.platform === 'darwin';

const APP_NAME = 'Jest';

const ICON = '/assets/jest_logo.png';

const NOTIFICATIONS = {
  success: {
    text: (isDarwin ? '✅ ' : '') + '%d tests passed',
    options: {
      title: '%d%% Passed',
      image: ICON,
      name: APP_NAME,
      sticky: false,
      priority: 0,
    },
  },
  failure: {
    text: (isDarwin ? '⛔️ ' : '') + '%d of %d tests failed',
    options: {
      title: '%d%% Failed',
      image: ICON,
      name: APP_NAME,
      sticky: false,
      priority: 1,
    },
  },
};

type Notification = {
  text: string,
  options: {
    title: string,
    image: string,
    name: string,
    sticky: boolean,
    priority: ?number;
  }
};

class Growler {

  static onTestResults(result: AggregatedResult): void {
    let info;
    let title;
    let text;

    if (result.success) {
      info = NOTIFICATIONS['success'];
      title = util.format(info.options.title, 100);
      text = util.format(info.text, result.numPassedTests);
    } else {
      info = NOTIFICATIONS['failure'];
      title = util.format(info.options.title, Math.ceil(
        (result.numFailedTests / result.numTotalTests) * 100,
      ));
      text = util.format(
        info.text,
        result.numFailedTests,
        result.numTotalTests,
      );
    }
    const image = path.join(__dirname, info.options.image);

    const notification = {
      text,
      options: Object.assign({}, info.options, {title, image}),
    };

    this.trigger(notification);
  }

  static trigger(notification: Notification): void {
    growl(
      notification.text,
      notification.options
    );
  }
}

module.exports = Growler;
