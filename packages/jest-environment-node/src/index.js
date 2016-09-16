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
import type {Script} from 'vm';

const FakeTimers = require('jest-util').FakeTimers;
const installCommonGlobals = require('jest-util').installCommonGlobals;
const ModuleMocker = require('jest-mock');
const vm = require('vm');

const isNaN = global.isNaN;

class NodeEnvironment {

  fakeTimers: ?FakeTimers;
  global: ?Global;
  moduleMocker: ?ModuleMocker;

  constructor(config: Config) {
    const global = this.global = {};
    vm.createContext(this.global);
    global.global = global;
    global.clearInterval = clearInterval;
    global.clearTimeout = clearTimeout;
    global.setInterval = setInterval;
    global.setTimeout = setTimeout;
    global.isNaN = isNaN;
    global.ArrayBuffer = ArrayBuffer;
    global.JSON = JSON;
    global.Promise = Promise;
    installCommonGlobals(global, config.globals);
    this.moduleMocker = new ModuleMocker();
    this.fakeTimers = new FakeTimers(global, this.moduleMocker, config);
  }

  dispose() {
    if (this.fakeTimers) {
      this.fakeTimers.dispose();
    }
    this.global = null;
    this.fakeTimers = null;
  }

  runScript(script: Script): ?any {
    if (this.global) {
      return script.runInContext(this.global);
    }
    return null;
  }

}

module.exports = NodeEnvironment;
