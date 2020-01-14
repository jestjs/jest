/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {GlobalConfig, ProjectConfig} from '@jest/config-utils';

const VERSION = require('../../package.json').version;

export default function logDebugMessages(
  globalConfig: GlobalConfig,
  configs: Array<ProjectConfig> | ProjectConfig,
  outputStream: NodeJS.WriteStream,
): void {
  const output = {
    configs,
    globalConfig,
    version: VERSION,
  };
  outputStream.write(JSON.stringify(output, null, '  ') + '\n');
}
