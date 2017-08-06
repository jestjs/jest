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

const SNAPSHOT_EXTENSION = 'snap';

function isValidPath(
  globalConfig: GlobalConfig,
  config: ProjectConfig,
  filePath: string,
) {
  return (
    !filePath.includes(globalConfig.coverageDirectory) &&
    !filePath.endsWith(`.${SNAPSHOT_EXTENSION}`)
  );
}

module.exports = isValidPath;
