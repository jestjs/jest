/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * @flow
 */
'use strict';

import type {Config} from 'types/Config';
import type {Global} from 'types/Global';

const FakeTimers = require('jest-util').FakeTimers;
const installCommonGlobals = require('jest-util').installCommonGlobals;

class JSDOMEnvironment {

  document: ?Object;
  fakeTimers: ?FakeTimers;
  global: ?Global;

  constructor(config: Config): void {
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

  dispose(): void {
    if (this.global) {
      this.global.close();
    }
    this.global = null;
    this.document = null;
    this.fakeTimers = null;
  }

  runSourceText(sourceText: string, filename: string): ?any {
    if (this.global) {
      return this.global.eval(sourceText + '\n//# sourceURL=' + filename);
    }
    return null;
  }

  runWithRealTimers(cb: Function): void {
    if (this.global && this.fakeTimers) {
      this.fakeTimers.runWithRealTimers(cb);
    }
  }

}

module.exports = JSDOMEnvironment;
