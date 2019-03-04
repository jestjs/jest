/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config} from '@jest/types';
import {isSnapshotPath} from 'jest-snapshot';

export default function isValidPath(
  globalConfig: Config.GlobalConfig,
  filePath: Config.Path,
) {
  return (
    !filePath.includes(globalConfig.coverageDirectory) &&
    !isSnapshotPath(filePath)
  );
}
