/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {WriteStream} from 'tty';
import type {Config} from '@jest/types';
const VERSION = require('../../package.json').version;

// if the output here changes, update `getConfig` in e2e/runJest.ts
export default function logDebugMessages(
  globalConfig: Config.GlobalConfig,
  configs: Array<Config.ProjectConfig> | Config.ProjectConfig,
  outputStream: WriteStream,
): void {
  const output = {
    configs,
    globalConfig: {
      ...globalConfig,
      testPathPatterns: globalConfig.testPathPatterns.patterns,
    },
    version: VERSION,
  };
  outputStream.write(`${JSON.stringify(output, null, '  ')}\n`);
}
