/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import type {Config} from '@jest/types';

export default function relativePath(
  config: Config.GlobalConfig | Config.ProjectConfig,
  testPath: string,
): {basename: string; dirname: string} {
  // this function can be called with ProjectConfigs or GlobalConfigs. GlobalConfigs
  // do not have config.cwd, only config.rootDir. Try using config.cwd, fallback
  // to config.rootDir. (Also, some unit just use config.rootDir, which is ok)
  testPath = path.relative(
    (config as Config.ProjectConfig).cwd || config.rootDir,
    testPath,
  );
  const dirname = path.dirname(testPath);
  const basename = path.basename(testPath);
  return {basename, dirname};
}
