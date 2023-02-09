/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
      this._stdin.setRawMode = function () {};
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
 * Watch plugins are not transpiled hence why we're leaving
 * this file out of typescript migration
 */
module.exports = MockStdinWatchPlugin;
