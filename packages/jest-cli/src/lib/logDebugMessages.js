/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {GlobalConfig, ProjectConfig} from 'types/Config';
import type {TestFramework} from 'types/TestRunner';

import {version as VERSION} from '../../package.json';

const logDebugMessages = (
  globalConfig: GlobalConfig,
  config: ProjectConfig,
  outputStream: stream$Writable | tty$WriteStream,
): void => {
  /* $FlowFixMe */
  const testFramework = (require(config.testRunner): TestFramework);
  const output = {
    config,
    framework: testFramework.name,
    globalConfig,
    version: VERSION,
  };
  outputStream.write(JSON.stringify(output, null, '  ') + '\n');
};

module.exports = logDebugMessages;
