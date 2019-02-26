/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

class MockStdinWatchPlugin {
  constructor({stdin, config}) {
    this._stdin = stdin;
    if (typeof this._stdin.setRawMode !== 'function') {
      this._stdin.setRawMode = function() {};
    }
    this._config = config;
  }

  apply(jestHooks) {
    jestHooks.onTestRunComplete(() => {
      const {keys} = this._config.input.shift();
      keys.forEach(key => this._stdin.emit('data', key));
    });
  }
}

/**
 * Tried re-writing this in typescript but the tests just failed
 *
 * I've tried exporting them the following way
 * 1. "module.exports = MockStdinWatchPlugin"
 * 2. "exports = MockStdinWatchPlugin"
 * 3. "export default = MockStdinWatchPlugin" (in Progress)
 */
module.exports = MockStdinWatchPlugin;
