/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

export default function getProjectDisplayName(
  projectConfig: Config.ProjectConfig,
): string | undefined {
  const {displayName} = projectConfig;
  if (!displayName) {
    return undefined;
  }
  return displayName.name;
}
