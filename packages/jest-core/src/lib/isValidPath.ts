/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {isSnapshotPath} from 'jest-snapshot';

export default function isValidPath(
  globalConfig: Config.GlobalConfig,
  filePath: string,
): boolean {
  return (
    !filePath.includes(globalConfig.coverageDirectory) &&
    !isSnapshotPath(filePath)
  );
}
