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

import type {Config} from 'types/Config';
import type {Global} from 'types/Global';

const FakeTimers = require('jest-util').FakeTimers;
const installCommonGlobals = require('jest-util').installCommonGlobals;
const vm = require('vm');

class NodeEnvironment {

  fakeTimers: ?FakeTimers;
  global: ?Global;

  constructor(config: Config) {
    const global = this.global = {};
    vm.createContext(this.global);
    global.setTimeout = setTimeout;
    global.clearTimeout = clearTimeout;
    global.setInterval = setInterval;
    global.clearInterval = clearInterval;
    global.Promise = Promise;
    global.JSON = JSON;
    installCommonGlobals(global, config.globals);
    this.fakeTimers = new FakeTimers(global);
  }

  dispose() {
    this.global = null;
    this.fakeTimers = null;
  }

  runSourceText(sourceText: string, filename: string): ?any {
    if (this.global) {
      return vm.runInContext(sourceText, this.global, {
        filename,
        displayErrors: false,
      });
    }
    return null;
  }

  runWithRealTimers(callback: Function) {
    if (this.global && this.fakeTimers) {
      this.fakeTimers.runWithRealTimers(callback);
    }
  }

}

module.exports = NodeEnvironment;
