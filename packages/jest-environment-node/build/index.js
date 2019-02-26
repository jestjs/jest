'use strict';

function _vm() {
  const data = _interopRequireDefault(require('vm'));

  _vm = function _vm() {
    return data;
  };

  return data;
}

function _fakeTimers() {
  const data = require('@jest/fake-timers');

  _fakeTimers = function _fakeTimers() {
    return data;
  };

  return data;
}

function _jestUtil() {
  const data = require('jest-util');

  _jestUtil = function _jestUtil() {
    return data;
  };

  return data;
}

function _jestMock() {
  const data = _interopRequireDefault(require('jest-mock'));

  _jestMock = function _jestMock() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 */
class NodeEnvironment {
  constructor(config) {
    this.context = _vm().default.createContext();

    const global = (this.global = _vm().default.runInContext(
      'this',
      Object.assign(this.context, config.testEnvironmentOptions)
    ));

    global.global = global;
    global.clearInterval = clearInterval;
    global.clearTimeout = clearTimeout;
    global.setInterval = setInterval;
    global.setTimeout = setTimeout;
    global.ArrayBuffer = ArrayBuffer; // URL and URLSearchParams are global in Node >= 10

    if (typeof URL !== 'undefined' && typeof URLSearchParams !== 'undefined') {
      /* global URL, URLSearchParams */
      global.URL = URL;
      global.URLSearchParams = URLSearchParams;
    }

    (0, _jestUtil().installCommonGlobals)(global, config.globals);
    this.moduleMocker = new (_jestMock()).default.ModuleMocker(global);

    const timerIdToRef = id => ({
      id,

      ref() {
        return this;
      },

      unref() {
        return this;
      }
    });

    const timerRefToId = timer => (timer && timer.id) || null;

    const timerConfig = {
      idToRef: timerIdToRef,
      refToId: timerRefToId
    };
    this.fakeTimers = new (_fakeTimers()).JestFakeTimers({
      config,
      global,
      moduleMocker: this.moduleMocker,
      timerConfig
    });
  }

  setup() {
    return Promise.resolve();
  }

  teardown() {
    if (this.fakeTimers) {
      this.fakeTimers.dispose();
    }

    this.context = null;
    this.fakeTimers = null;
    return Promise.resolve();
  } // Disabling rule as return type depends on script's return type.

  runScript(script) {
    if (this.context) {
      return script.runInContext(this.context);
    }

    return null;
  }
}

module.exports = NodeEnvironment;
