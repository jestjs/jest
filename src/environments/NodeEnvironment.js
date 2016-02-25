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
const vm = require('vm');

class NodeEnvironment {

  constructor(config) {
    this.global = {};
    vm.createContext(this.global);
    this.global.setTimeout = setTimeout;
    this.global.clearTimeout = clearTimeout;
    this.global.setInterval = setInterval;
    this.global.clearInterval = clearInterval;
    this.global.Promise = Promise;
    this.global.JSON = JSON;
    installCommonGlobals(this.global, config.globals);
    this.fakeTimers = new FakeTimers(this.global);
  }

  dispose() {
    this.global = null;
    this.fakeTimers = null;
  }

  runSourceText(sourceText, filename) {
    return vm.runInContext(sourceText, this.global, {
      filename,
      displayErrors: false,
    });
  }

  runWithRealTimers(callback) {
    if (this.global) {
      this.fakeTimers.runWithRealTimers(callback);
    }
  }

}

module.exports = NodeEnvironment;
