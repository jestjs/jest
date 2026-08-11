/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const NodeEnvironment = require('jest-environment-node').TestEnvironment;

// `setup` runs after the source map formatter is installed and `teardown` runs
// after it is uninstalled, so this environment can tell whether the formatter
// was really removed rather than left behind on `Error.prepareStackTrace`.
class TestEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();
    this.formatterDuringRun = Error.prepareStackTrace;
  }

  async teardown() {
    await super.teardown();

    if (typeof this.formatterDuringRun !== 'function') {
      throw new TypeError(
        'Expected a source map formatter to be installed during the run.',
      );
    }

    if (Error.prepareStackTrace === this.formatterDuringRun) {
      throw new Error(
        'Error.prepareStackTrace was not restored after the environment was torn down.',
      );
    }
  }
}

module.exports = TestEnvironment;
