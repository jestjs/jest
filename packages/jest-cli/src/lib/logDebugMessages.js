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
  pipe.write('jest version = ' + VERSION + '\n');
  pipe.write('test framework = ' + testFramework.name + '\n');
  pipe.write('config = ' + JSON.stringify(config, null, '  ') + '\n');

};

module.exports = logDebugMessages;
