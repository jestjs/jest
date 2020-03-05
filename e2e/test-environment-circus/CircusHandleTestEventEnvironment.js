/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const JSDOMEnvironment = require('jest-environment-jsdom');

class TestEnvironment extends JSDOMEnvironment {
  async handleTestEvent(event) {
    if (event.hook) {
      console.log(event.name + ': ' + event.hook.type);
    } else if (event.test) {
      console.log(event.name + ': ' + event.test.name);
    } else {
      console.log(event.name);
    }
  }
}

module.exports = TestEnvironment;
