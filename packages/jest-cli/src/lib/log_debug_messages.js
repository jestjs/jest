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

import {version as VERSION} from '../../package.json';

const logDebugMessages = (
  globalConfig: GlobalConfig,
  configs: Array<ProjectConfig>,
  outputStream: stream$Writable | tty$WriteStream,
): void => {
  const output = {
    configs,
    globalConfig,
    version: VERSION,
  };
  outputStream.write(JSON.stringify(output, null, '  ') + '\n');
};

module.exports = logDebugMessages;
