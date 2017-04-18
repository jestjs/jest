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

const VERSION = require('../../package.json').version;

const logDebugMessages = (
  config: Config,
  pipe: stream$Writable | tty$WriteStream,
): void => {
  /* $FlowFixMe */
  const testFramework = require(config.testRunner);
  /* eslint-disable sort-keys */
  const output = {
    version: VERSION,
    framework: testFramework.name,
    config,
  };
  /* eslint-enable sort-keys */
  pipe.write(JSON.stringify(output, null, '  ') + '\n');
};

module.exports = logDebugMessages;
