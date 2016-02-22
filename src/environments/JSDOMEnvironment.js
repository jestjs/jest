/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const FakeTimers = require('../lib/FakeTimers');
const installCommonGlobals = require('./installCommonGlobals');

class JSDOMEnvironment {

  constructor(config) {
    // lazy require
    this.document = require('jsdom').jsdom(/* markup */undefined, {
      url: config.testURL,
    });
    this.global = this.document.defaultView;
    // Node's error-message stack size is limited at 10, but it's pretty useful
    // to see more than that when a test fails.
    this.global.Error.stackTraceLimit = 100;
    installCommonGlobals(this.global, config.globals);
    this.fakeTimers = new FakeTimers(this.global);
  }

  dispose() {
    this.global.close();
    this.global = null;
    this.document = null;
    this.fakeTimers = null;
  }

  runSourceText(sourceText, filename) {
    return this.global.eval(sourceText + '\n//# sourceURL=' + filename);
  }

  runWithRealTimers(cb) {
    if (this.global) {
      this.fakeTimers.runWithRealTimers(cb);
    }
  }

}

module.exports = JSDOMEnvironment;
