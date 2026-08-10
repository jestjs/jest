/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const JSDOMEnvironment = require('jest-environment-jsdom').TestEnvironment;

class TestEnvironment extends JSDOMEnvironment {
  handleTestEvent(event) {
    console.log(event.name + (event.test ? `: ${event.test.name}` : ''));
  }
}

module.exports = TestEnvironment;
