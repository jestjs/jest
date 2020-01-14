/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {GlobalConfig, Path} from '@jest/config-utils';
import {isSnapshotPath} from 'jest-snapshot';

export default function isValidPath(
  globalConfig: GlobalConfig,
  filePath: Path,
) {
  return (
    !filePath.includes(globalConfig.coverageDirectory) &&
    !isSnapshotPath(filePath)
  );
}
