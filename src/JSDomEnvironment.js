/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const FakeTimers = require('./lib/FakeTimers');
const utils = require('./lib/utils');
const vm = require('vm');

class JSDomEnvironment {

  constructor(config) {
    // lazy require
    this.document = require('jsdom').jsdom(/* markup */undefined, {
      url: config.testURL,
    });
    this.global = this.document.defaultView;

    // Node's error-message stack size is limited at 10, but it's pretty useful
    // to see more than that when a test fails.
    this.global.Error.stackTraceLimit = 100;

    // Forward some APIs
    this.global.Buffer = Buffer;
    // `this.global.process` is mutated in FakeTimers. Make a copy of the
    // object for the jsdom environment to prevent memory leaks.
    this.global.process = Object.assign({}, process);
    this.global.setImmediate = setImmediate;
    this.global.clearImmediate = clearImmediate;

    this.fakeTimers = new FakeTimers(this.global);

    Object.assign(this.global, utils.deepCopy(config.globals));
  }

  dispose() {
    this.global.close();
  }

  runSourceText(sourceText, filename) {
    vm.runInContext(sourceText, this.document._ownerDocument._global, {
      filename,
      displayErrors: false,
    });
  }

  runWithRealTimers(cb) {
    this.fakeTimers.runWithRealTimers(cb);
  }

}

module.exports = JSDomEnvironment;
